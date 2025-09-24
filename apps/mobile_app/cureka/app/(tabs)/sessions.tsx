import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SessionsList from '@/components/SessionsList';
import { Colors } from '@/constants/colors';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const TabBar = ({ activeTab, onTabPress }: { activeTab: string; onTabPress: (tab: string) => void }) => {
  const tabs = ['All', 'Completed', 'Active'];

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => onTabPress(tab)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Filter ${tab} sessions`}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function SessionsScreen() {
  const [activeTab, setActiveTab] = useState('All');
  const router = useRouter();

  const handleNewChat = () => {
    // Navigate to chat to start a new AI session
    router.push('/(chat)/chat' as any);
  };

  const handleSessionPress = (session: any) => {
    // Navigate to session details or chat
    // router.push(`/(chat)/chat?sessionId=${session.session_id}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Sessions</Text>
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={handleNewChat}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Start new chat"
        >
          <FontAwesome name="plus" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <TabBar activeTab={activeTab} onTabPress={setActiveTab} />

      <View style={styles.content}>
        <SessionsList onSessionPress={handleSessionPress} limit={activeTab === 'Active' ? 5 : undefined} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  newChatButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.white,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
});