import { useState, useEffect, useCallback } from 'react';

export interface AISession {
  session_id: string;
  patient_id: string;
  start_time: string;
  end_time?: string;
  status: 'active' | 'completed';
  summary?: string;
  action_taken?: string;
  doctor_name?: string;
  duration?: number; // in minutes
}

export function useAISessions() {
  const [sessions, setSessions] = useState<AISession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for now - will integrate with API later
      const mockSessions: AISession[] = [
        {
          session_id: 'session-1',
          patient_id: 'patient-123',
          start_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          end_time: new Date(Date.now()).toISOString(),
          status: 'completed',
          summary: 'Patient had consultation about fever and cold symptoms',
          doctor_name: 'Priya Patel',
          duration: 30,
        },
        {
          session_id: 'session-2',
          patient_id: 'patient-123',
          start_time: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          end_time: new Date(Date.now() - 82800000).toISOString(),
          status: 'completed',
          summary: 'Booking appointment for cardiac follow-up',
          doctor_name: 'Rajesh Sharma',
          duration: 45,
        },
      ];

      setSessions(mockSessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  const createSession = useCallback(async () => {
    try {
      const newSession: AISession = {
        session_id: `session-${Date.now()}`,
        patient_id: 'patient-123', // Will get from auth context
        start_time: new Date().toISOString(),
        status: 'active',
      };

      setSessions((prev) => [newSession, ...prev]);
      return newSession;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create session');
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    createSession,
    refetch: fetchSessions,
  };
}