import React from 'react';
import { Text, View, Button, StyleSheet } from 'react-native';

export default function HomeScreen() {
  const handleNavigate = () => {
    // Navigate to Profile or other screens
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Home</Text>
      <Button title="Go to Profile" onPress={handleNavigate} />
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
});
