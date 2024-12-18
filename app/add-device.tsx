import React, { useState } from 'react';
import { Text, View, Button, StyleSheet, TextInput } from 'react-native';

export default function AddDeviceScreen() {
  const [deviceName, setDeviceName] = useState('');
  
  const handleAddDevice = async () => {
    try {
      const response = await fetch('https://your-api-url.com/api/add-device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceName }),
      });

      const data = await response.json();
      if (data.success) {
        // Handle success, navigate to another screen or show a confirmation
      } else {
        // Handle error
      }
    } catch (error) {
      console.error('Add device failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Device</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Device Name"
        value={deviceName}
        onChangeText={setDeviceName}
      />
      <Button title="Add Device" onPress={handleAddDevice} />
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
