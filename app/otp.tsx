import React, { useState } from 'react';
import { Text, View, TextInput, Button, StyleSheet } from 'react-native';

export default function OTPScreen() {
  const [otp, setOtp] = useState('');
  
  const handleVerifyOtp = async () => {
    try {
      const response = await fetch('https://your-api-url.com/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp }),
      });

      const data = await response.json();
      if (data.success) {
        // Navigate to Home
      } else {
        // Handle error
      }
    } catch (error) {
      console.error('OTP verification failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter OTP</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="numeric"
      />
      <Button title="Verify OTP" onPress={handleVerifyOtp} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    width: '80%',
    padding: 10,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    borderRadius: 5,
  },
});
