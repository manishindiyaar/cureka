// Debug environment variables
console.log('==== ENVIRONMENT VARIABLES CHECK ====');
console.log('EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
console.log('Available env vars:', Object.keys(process.env).filter(key => key.startsWith('EXPO_PUBLIC_'))
.join(', '));
console.log('======================================');