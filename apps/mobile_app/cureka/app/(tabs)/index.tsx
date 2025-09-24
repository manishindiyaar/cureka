import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import TalkScreen from './talk';
import SessionsScreen from './sessions';
import VideoConsultScreen from './video-consult';

const Tab = createMaterialTopTabNavigator();

export default function TabIndex() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: Colors.white,
          tabBarInactiveTintColor: Colors.textSecondary || Colors.gray[500],
          tabBarIndicatorStyle: {
            backgroundColor: Colors.primaryDark,
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
            title: 'Request Video Consultancy',
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}