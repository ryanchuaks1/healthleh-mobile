import React, { useRef } from "react";
import { View, TextInput, StyleSheet, TextInputProps } from "react-native";

interface OTPInputProps extends TextInputProps {
  otp: string;
  setOtp: (otp: string) => void;
  isDisabled?: boolean;
}

const OTPInput: React.FC<OTPInputProps> = ({ otp, setOtp, isDisabled = false }) => {
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleChangeText = (text: string, index: number) => {
    let newText = text;
    if (newText.length > 1) {
      newText = newText.slice(-1);
    }
    const otpArray = otp.split("");
    otpArray[index] = newText;
    setOtp(otpArray.join(""));
    if (newText && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.otpContainer}>
      {Array(4)
        .fill(0)
        .map((_, index) => (
          <TextInput
            key={index}
            style={styles.otpBox}
            keyboardType="number-pad"
            maxLength={1}
            onChangeText={(text) => handleChangeText(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            ref={(ref) => (inputs.current[index] = ref)}
            editable={!isDisabled}
            value={otp[index] || ""}
          />
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  otpBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    width: 50,
    height: 50,
    textAlign: "center",
    fontSize: 24,
    borderRadius: 5,
    marginHorizontal: 5,
  },
});

export default OTPInput;
