import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

export default function AppointmentsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Appointments</Text>
      <Text style={styles.text}>
        Appointment booking functionality will be implemented in future stories.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary || Colors.primaryDark,
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    color: Colors.text || Colors.gray[600],
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});