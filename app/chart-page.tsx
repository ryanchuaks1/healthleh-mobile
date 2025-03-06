import React, { useEffect, useState } from "react";
import { Dimensions, ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../config";
import { router } from "expo-router";

interface DailyRecord {
  recordDate: string;
  totalSteps: number;
  totalCaloriesBurned: number | null;
  exerciseDurationMinutes: number | null;
  weight: number | null;
}

interface AggregatedRecord {
  recordDate: string;
  totalSteps: number;
  totalCaloriesBurned: number;
  exerciseDurationMinutes: number;
  weight: number;
}

type ChartMode = "daily" | "3-day" | "weekly";
type Timeframe = 7 | 30 | 90;

/**
 * Helper function that rounds a number to its nearest most significant figure.
 * For example:
 *   7523 => 8000
 *   234  => 200
 */
const roundToSignificant = (num: number): number => {
  if (num === 0) return 0;
  const d = Math.floor(Math.log10(Math.abs(num)));
  const factor = Math.pow(10, d);
  return Math.round(num / factor) * factor;
};

const aggregateRecords = (mode: ChartMode, records: DailyRecord[]): AggregatedRecord[] => {
  if (mode === "daily") {
    return records.map((r) => ({
      recordDate: r.recordDate,
      totalSteps: r.totalSteps,
      totalCaloriesBurned: r.totalCaloriesBurned ?? 0,
      exerciseDurationMinutes: r.exerciseDurationMinutes ?? 0,
      weight: r.weight ?? 0,
    }));
  }

  const groupSize = mode === "3-day" ? 3 : 7;
  const aggregated: AggregatedRecord[] = [];
  for (let i = 0; i < records.length; i += groupSize) {
    const group = records.slice(i, i + groupSize);
    if (group.length === 0) break;
    const repDate = group[Math.floor(group.length / 2)].recordDate;
    const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    aggregated.push({
      recordDate: repDate,
      totalSteps: avg(group.map((r) => r.totalSteps)),
      totalCaloriesBurned: avg(group.map((r) => r.totalCaloriesBurned ?? 0)),
      exerciseDurationMinutes: avg(group.map((r) => r.exerciseDurationMinutes ?? 0)),
      weight: avg(group.map((r) => r.weight ?? 0)),
    });
  }
  return aggregated;
};

const ProgressCharts: React.FC = () => {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [userPhoneNumber, setUserPhoneNumber] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<ChartMode>("daily");
  const [timeframe, setTimeframe] = useState<Timeframe>(30);

  // Retrieve user phone number from AsyncStorage
  useEffect(() => {
    const getUserPhone = async () => {
      try {
        const phone = await AsyncStorage.getItem("userPhoneNumber");
        if (phone) {
          setUserPhoneNumber(phone);
        } else {
          console.error("User phone number not found in AsyncStorage.");
          router.push("/");
        }
      } catch (error) {
        console.error("Error retrieving user phone number:", error);
      }
    };
    getUserPhone();
  }, []);

  // Fetch daily records data once userPhoneNumber is available
  useEffect(() => {
    if (!userPhoneNumber) return;
    setLoading(true);
    fetch(`${config.API_BASE_URL}/api/dailyrecords/${userPhoneNumber}`)
      .then((res) => res.json())
      .then((data: DailyRecord[]) => {
        // Sort records by recordDate ascending.
        const sortedRecords = data.sort((a, b) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime());
        setRecords(sortedRecords);
      })
      .catch((err) => console.error("Error fetching daily records:", err))
      .finally(() => setLoading(false));
  }, [userPhoneNumber]);

  // Filter out records not in the selected timeframe, adjusting for UTC+8
  const filteredByTime = records.filter((record) => {
    const recordDate = new Date(record.recordDate);
    // Adjust from UTC to local time (UTC+8)
    const localRecordDate = new Date(recordDate.getTime() + 8 * 60 * 60 * 1000);
    const today = new Date();
    const pastDate = new Date(today.getTime() - timeframe * 24 * 60 * 60 * 1000);
    return localRecordDate >= pastDate && localRecordDate < today;
  });

  // Aggregate data based on the selected chart mode
  const aggregatedData = aggregateRecords(chartMode, filteredByTime);
  const labels = aggregatedData.map((record, index) => {
    if (index === 0 || index === aggregatedData.length - 1) {
      const date = new Date(record.recordDate);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    return "";
  });
  const stepsData = aggregatedData.map((record) => record.totalSteps);
  const caloriesData = aggregatedData.map((record) => record.totalCaloriesBurned);
  const durationData = aggregatedData.map((record) => record.exerciseDurationMinutes);
  const weightData = aggregatedData.map((record) => record.weight);

  const chartWidth = Dimensions.get("window").width - 24;
  const baseChartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
    labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
    propsForDots: {
      r: "2",
      strokeWidth: "1",
      stroke: "#ffa726",
    },
  };

  // Use our helper to format y-axis labels for all charts.
  const formatLabel = (y: string): string => {
    const num = parseFloat(y);
    return roundToSignificant(num).toString();
  };

  // Render toggle for chart mode (daily, 3-day, weekly)
  const renderModeToggle = () => {
    const modes: ChartMode[] = ["daily", "3-day", "weekly"];
    return (
      <View className="flex-row justify-center mb-4">
        {modes.map((mode) => (
          <TouchableOpacity
            key={mode}
            className={`p-2 mx-1 rounded-lg border ${chartMode === mode ? "bg-orange-500 border-orange-500" : "bg-white border-gray-300"}`}
            onPress={() => setChartMode(mode)}
          >
            <Text className={`text-sm font-bold ${chartMode === mode ? "text-white" : "text-gray-800"}`}>
              {mode === "daily" ? "Daily" : mode === "3-day" ? "3-Day" : "Weekly"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render toggle for timeframe (past 7, 30, 90 days)
  const renderTimeframeToggle = () => {
    const timeframes: Timeframe[] = [7, 30, 90];
    return (
      <View className="flex-row justify-center mb-4">
        {timeframes.map((tf) => (
          <TouchableOpacity
            key={tf}
            className={`p-2 mx-1 rounded-lg border ${timeframe === tf ? "bg-orange-500 border-orange-500" : "bg-white border-gray-300"}`}
            onPress={() => setTimeframe(tf)}
          >
            <Text className={`text-sm font-bold ${timeframe === tf ? "text-white" : "text-gray-800"}`}>Past {tf} Days</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-100 py-6 px-[12px]">
      <Text className="text-3xl font-bold text-orange-800 mb-6 text-center">Your Progress Over Time</Text>
      {renderModeToggle()}
      {renderTimeframeToggle()}
      {loading && <ActivityIndicator size="large" color="#4CAF50" />}
      {!loading && aggregatedData.length === 0 && <Text className="text-center text-gray-600">No records found for the selected timeframe.</Text>}
      {!loading && aggregatedData.length > 0 && (
        <>
          {/* Steps Chart */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-800 mb-2 text-center">Steps</Text>
            <LineChart
              data={{ labels, datasets: [{ data: stepsData }] }}
              width={chartWidth}
              height={220}
              chartConfig={baseChartConfig}
              formatYLabel={formatLabel}
              withInnerLines={false}
              withOuterLines={false}
              bezier
              fromZero
              style={{ borderRadius: 16 }}
            />
          </View>
          {/* Calories Burned Chart */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-800 mb-2 text-center">Calories Burned</Text>
            <LineChart
              data={{ labels, datasets: [{ data: caloriesData }] }}
              width={chartWidth}
              height={220}
              chartConfig={baseChartConfig}
              formatYLabel={formatLabel}
              withInnerLines={false}
              withOuterLines={false}
              bezier
              fromZero
              style={{ borderRadius: 16 }}
            />
          </View>
          {/* Exercise Duration Chart */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-800 mb-2 text-center">Exercise Duration (mins)</Text>
            <LineChart
              data={{ labels, datasets: [{ data: durationData }] }}
              width={chartWidth}
              height={220}
              chartConfig={baseChartConfig}
              formatYLabel={formatLabel}
              withInnerLines={false}
              withOuterLines={false}
              bezier
              fromZero
              style={{ borderRadius: 16 }}
            />
          </View>
          {/* Weight Chart */}
          {/*           <View className="mb-6">
            <Text className="text-xl font-bold text-gray-800 mb-2 text-center">Weight (kg)</Text>
            <LineChart
              data={{ labels, datasets: [{ data: weightData }] }}
              width={chartWidth}
              height={220}
              chartConfig={baseChartConfig}
              formatYLabel={formatLabel}
              withInnerLines={false}
              withOuterLines={false}
              bezier
              fromZero
              style={{ borderRadius: 16 }}
            />
          </View> */}
        </>
      )}
      <TouchableOpacity className="bg-slate-600 p-3 rounded-lg shadow-md my-1" onPress={() => router.push("/home")}>
        <Text className="text-center text-white font-bold">Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ProgressCharts;
