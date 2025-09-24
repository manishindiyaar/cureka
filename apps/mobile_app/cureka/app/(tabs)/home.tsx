import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TalkScreen from './talk';
import SessionsScreen from './sessions';
import VideoConsultScreen from './video-consult';
import { Colors } from '@/constants/colors';

const Tab = createMaterialTopTabNavigator();

export default function HomeScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: Colors.white,
          tabBarInactiveTintColor: Colors.textSecondary || Colors.gray[500],
          tabBarIndicatorStyle: {
            backgroundColor: Colors.primary || Colors.primaryDark,
            height: '100%',
            borderRadius: 8,
          },
          tabBarStyle: {
            backgroundColor: Colors.white,
            elevation: 2,
            shadowColor: Colors.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            margin: 16,
            borderRadius: 12,
            overflow: 'hidden',
          },
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: '500',
            textTransform: 'none',
          },
        }}
      >
        <Tab.Screen
          name="talk"
          component={TalkScreen}
          options={{
            title: 'Talk',
          }}
        />
        <Tab.Screen
          name="sessions"
          component={SessionsScreen}
          options={{
            title: 'Sessions',
          }}
        />
        <Tab.Screen
          name="video-consult"
          component={VideoConsultScreen}
          options={{
            title: 'Video Consult',
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}