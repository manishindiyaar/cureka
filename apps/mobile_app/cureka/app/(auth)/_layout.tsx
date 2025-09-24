import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Welcome screens */}
      <Stack.Screen name="index" />
      {/* Phone number input */}
      <Stack.Screen name="phone" />
      {/* OTP verification */}
      <Stack.Screen name="otp" />
      {/* Name collection (for new users) */}
      <Stack.Screen name="name" />
    </Stack>
  );
}