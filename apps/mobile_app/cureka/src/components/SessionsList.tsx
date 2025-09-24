import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useAISessions } from '@/hooks/useAISessions';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SessionsListProps {
  onSessionPress?: (session: any) => void;
  limit?: number;
}

export default function SessionsList({ onSessionPress, limit }: SessionsListProps) {
  const { sessions, loading, error } = useAISessions();

  const displaySessions = limit ? sessions.slice(0, limit) : sessions;

  const formatDuration = (duration?: number) => {
    if (!duration) return 'Not completed';
    return `${duration} min`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const renderSession = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => onSessionPress?.(item)}
      accessibilityRole="button"
      accessible={false}
    >
      <View style={styles.sessionHeader}>
        <MaterialCommunityIcons name="calendar-text" size={20} color="#1f345a" style={styles.calendarIcon} />
        <Text style={styles.sessionDate}>{formatDate(item.start_time)}</Text>
        <Text style={styles.sessionStatus}>{item.status}</Text>
      </View>

      {item.doctor_name && (
        <View style={styles.doctorSection}>
          <MaterialCommunityIcons name="doctor" size={16} color="#6b7280" />
          <Text style={styles.doctorName}>Dr. {item.doctor_name}</Text>
        </View>
      )}

      {item.summary && (
        <Text style={styles.sessionSummary} numberOfLines={2}>
          {item.summary}
        </Text>
      )}

      {item.duration && (
        <View style={styles.durationSection}>
          <MaterialCommunityIcons name="clock-outline" size={14} color="#6b7280" />
          <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
        </View>
      )}

      <View style={styles.separator} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="refresh" size={24} color="#1f345a" style={styles.loadingIcon} />
        <Text style={styles.loadingText}>Loading sessions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="alert-circle" size={32} color="#8c1c24" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => location.reload()}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (displaySessions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="history" size={48} color="#6b7280" style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>No sessions yet</Text>
        <Text style={styles.emptyText}>
          Start a conversation with our AI assistant to create your first session.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={displaySessions}
      renderItem={renderSession}
      keyExtractor={(item) => item.session_id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  sessionCard: {
    marginBottom: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarIcon: {
    marginRight: 8,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f345a',
    flex: 1,
  },
  sessionStatus: {
    fontSize: 12,
    color: '#1f345a',
    textTransform: 'capitalize',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontWeight: '500',
  },
  doctorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  doctorName: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  sessionSummary: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  durationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  durationText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#6b7280',
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginTop: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingIcon: {
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#8c1c24',
    textAlign: 'center',
    marginTop: 16,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#1f345a',
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f345a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});