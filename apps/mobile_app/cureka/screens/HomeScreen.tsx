import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../src/constants/colors';
import { TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export const HomeScreen = () => {
  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Text style={[styles.title, { color: Colors.primaryDark }]}>Home</Text>

      <TouchableOpacity style={styles.aiButton}>
        <FontAwesome name="microphone" size={48} color="white" />
        <Text style={styles.aiButtonText}>Talk to AI Assistant</Text>
      </TouchableOpacity>

      <View style={styles.tabContainer}>
        <Text style={styles.tab}>Talk</Text>
        <Text style={styles.tab}>Sessions</Text>
        <Text style={styles.tab}>Video Consult</Text>
      </View>
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
  aiButton: {
    backgroundColor: '#1f345a',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 5,
    marginVertical: 30,
  },
  aiButtonText: {
    color: 'white',
    fontSize: 18,
    marginTop: 10,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  tab: {
    padding: 12,
    borderRadius: 8,
    fontWeight: 'bold',
  },
});