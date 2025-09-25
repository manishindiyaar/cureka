import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';

const { width } = Dimensions.get('window');

export default function WelcomeSlides() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const { checkAuthStatus } = useAuth();

  // Check if we're already authenticated on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      // Try to load existing tokens with checkAuthStatus
      const isAuthenticated = await checkAuthStatus();

      if (isAuthenticated) {
        // User is authenticated, redirect to tabs
        router.replace('/(tabs)');
        return;
      }
      // Not authenticated, show welcome screen
      setIsCheckingAuth(false);
    };

    checkExistingAuth();
  }, [checkAuthStatus]);

  const slides = [
    {
      id: 1,
      title: 'Welcome to Nabha',
      subtitle: 'Your AI-powered health companion',
      description: 'Get personalized healthcare support 24/7'
    },
    {
      id: 2,
      title: 'Smart AI Assistant',
      subtitle: 'Instant help for your health questions',
      description: 'Ask questions and get immediate, intelligent responses'
    },
    {
      id: 3,
      title: 'Ready to Start',
      subtitle: 'Your health journey awaits',
      description: 'Let\'s get started on taking control of your health'
    }
  ];

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.push('/(auth)/phone');
    }
  };

  // Show loading screen while checking auth
  if (isCheckingAuth) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryDark} />
          <Text style={styles.loadingText}>Checking authentication...</Text>
        </View>
      </View>
    );
  }

  const handleSkip = () => {
    router.push('/(auth)/phone');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Skip button at top-right */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* ScrollView for slides */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={[styles.slide, { width }]}>
            <View style={styles.content}>
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imageText}>Welcome Image {slide.id}</Text>
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.subtitle}>{slide.subtitle}</Text>
                <Text style={styles.description}>{slide.description}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Dots indicator */}
      <View style={styles.bottomContainer}>
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.activeDot
              ]}
            />
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    color: Colors.gray[600],
  },
  slide: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  imagePlaceholder: {
    width: 240,
    height: 240,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  imageText: {
    color: Colors.white,
    fontSize: 14,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primaryDark,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: Colors.gray[700],
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gray[300],
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: Colors.primaryDark,
  },
  button: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.gray[700],
  },
});