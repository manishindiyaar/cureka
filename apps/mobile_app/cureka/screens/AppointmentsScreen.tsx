import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../src/constants/colors';

export const AppointmentsScreen = () => {
  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Text style={[styles.title, { color: Colors.primaryDark }]}>Appointments</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.primaryLight }]}>Upcoming</Text>
          <View style={[styles.card, { backgroundColor: Colors.white }]}>
            <Text style={styles.cardTitle}>No upcoming appointments</Text>
            <Text style={styles.cardText}>Book an appointment to see it here</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.primaryLight }]}>Past</Text>
          <View style={[styles.card, { backgroundColor: Colors.white }]}>
            <Text style={styles.cardTitle}>View past appointments</Text>
            <Text style={styles.cardText}>Your appointment history appears here</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  cardText: {
    color: '#6b7280',
    fontSize: 14,
  },
});