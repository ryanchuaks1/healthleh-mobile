import React from 'react';
import { Text, View, Button, StyleSheet } from 'react-native';

export default function ProfileScreen() {
  const handleEditProfile = () => {
    // Navigate to edit profile page
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Profile</Text>
      <Button title="Edit Profile" onPress={handleEditProfile} />
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
