import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { FontAwesome } from '@expo/vector-icons';

export default function VideoConsultScreen() {
  const handleRequestConsultation = () => {
    // Will integrate with backend to request video consultation
    console.log('Requesting video consultation...');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <FontAwesome
            name="video-camera"
            size={64}
            color={Colors.primary}
            style={styles.headerIcon}
          />
          <Text style={styles.title}>Video Consultation</Text>
          <Text style={styles.subtitle}>
            Connect with healthcare professionals through video call
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.featureCard}>
            <Text style={styles.sectionTitle}>How it works</Text>

            <View style={styles.stepContainer}>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Request Consultation</Text>
                  <Text style={styles.stepDescription}>
                    Click the button below to request a video consultation
                  </Text>
                </View>
              </View>

              <View style={styles.stepDivider} />

              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Match with Doctor</Text>
                  <Text style={styles.stepDescription}>
                    We'll connect you with an available doctor for your consultation
                  </Text>
                </View>
              </View>

              <View style={styles.stepDivider} />

              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Start Video Call</Text>
                  <Text style={styles.stepDescription}>
                    Join the video call at your scheduled time
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Requirements</Text>

            <View style={styles.infoItem}>
              <FontAwesome name="clock-o" size={18} color={Colors.primary} style={styles.infoIcon} />
              <Text style={styles.infoText}>Available 24/7</Text>
            </View>

            <View style={styles.infoItem}>
              <FontAwesome name="user-md" size={18} color={Colors.primary} style={styles.infoIcon} />
              <Text style={styles.infoText}>Certified Medical Professionals</Text>
            </View>

            <View style={styles.infoItem}>
              <FontAwesome name="shield" size={18} color={Colors.primary} style={styles.infoIcon} />
              <Text style={styles.infoText}>Secure & Confidential</Text>
            </View>

            <View style={styles.infoItem}>
              <FontAwesome name="signal" size={18} color={Colors.primary} style={styles.infoIcon} />
              <Text style={styles.infoText}>Stable Internet Required</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.requestButton}
            onPress={handleRequestConsultation}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Request Video Consultation"
          >
            <FontAwesome name="plus" size={20} color={Colors.white} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Request Consultation</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  featureCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 24,
  },
  stepContainer: {
    marginTop: 8,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  stepNumberText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  stepDivider: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: 20,
    marginLeft: 50,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    fontSize: 15,
    color: Colors.text,
  },
  requestButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});