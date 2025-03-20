// ActivityContext.tsx
import React, { createContext, useContext, useState } from "react";

interface Activity {
  phoneNumber: string;
  exerciseType: string;
  durationMinutes: string;
  caloriesBurned: string;
  intensity: string;
  rating: string;
  distanceFromHome: string;
}

interface ActivityContextType {
  activity: Activity;
  setActivity: React.Dispatch<React.SetStateAction<Activity>>;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activity, setActivity] = useState<Activity>({
    phoneNumber: "",
    exerciseType: "",
    durationMinutes: "",
    caloriesBurned: "",
    intensity: "1",
    rating: "1",
    distanceFromHome: "",
  });

  return (
    <ActivityContext.Provider value={{ activity, setActivity }}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error("useActivity must be used within an ActivityProvider");
  }
  return context;
};
