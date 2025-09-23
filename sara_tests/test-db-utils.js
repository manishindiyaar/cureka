/**
 * Database Testing Utilities
 *
 * Provides utilities for managing test data in the database
 * Including creating test data, cleanup, and reset operations
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for tests

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials not found. Database operations will be limited.');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Generate test phone number
 */
function generateTestPhoneNumber() {
  // Use reserved test number range +91998X XXXXXX
  const prefix = '998';
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `+91${prefix}${random}`;
}

/**
 * Create test user
 */
async function createTestUser(userData = {}) {
  if (!supabase) {
    console.warn('⚠️  Supabase not configured, skipping database operations');
    return null;
  }

  const phoneNumber = userData.phone || generateTestPhoneNumber();
  const userId = userData.id || require('crypto').randomUUID();

  try {
    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        phone: phoneNumber.replace('+91', ''),
        role: 'PATIENT',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Create profile if requested
    if (userData.createProfile) {
      await createUserProfile(userId, userData.profile);
    }

    console.log(`✅ Created test user: ${user.phone}`);
    return user;
  } catch (error) {
    console.error('❌ Failed to create test user:', error);
    return null;
  }
}

/**
 * Create user profile
 */
async function createUserProfile(userId, profileData = {}) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        full_name: profileData.fullName || 'Test User',
        email: profileData.email || `test${Date.now()}@example.com`,
        date_of_birth: profileData.dob || null,
        gender: profileData.gender || null,
        blood_group: profileData.bloodGroup || null,
        emergency_contact: profileData.emergencyContact || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Failed to create profile:', error);
    return null;
  }
}

/**
 * Create test OTP entry
 */
async function createTestOtp(phoneNumber, otpData = {}) {
  if (!supabase) return null;

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + (otpData.expiryMinutes || 5));

  try {
    const { data, error } = await supabase
      .from('otps')
      .insert({
        number: phoneNumber.replace('+91', ''),
        otp: otpData.otp || parseInt(Math.floor(Math.random() * 9000) + 1000).toString(),
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        verified: otpData.verified || false,
        attempts: otpData.attempts || 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Failed to create test OTP:', error);
    return null;
  }
}

/**
 * Get recent OTP for phone number
 */
async function getRecentOtp(phoneNumber) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('otps')
      .select('*')
      .eq('number', phoneNumber.replace('+91', ''))
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('❌ Failed to get recent OTP:', error);
    return null;
  }
}

/**
 * Cleanup test data for phone number
 */
async function cleanupUserData(phoneNumber) {
  if (!supabase) {
    console.warn('⚠️  Supabase not configured, skipping cleanup');
    return false;
  }

  const cleanPhone = phoneNumber.replace('+91', '');

  try {
    // Delete OTPs
    await supabase
      .from('otps')
      .delete()
      .eq('number', cleanPhone);

    // Get user if exists
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('phone', cleanPhone)
      .single();

    if (user) {
      // Delete related data first
      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id);

      await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', user.id);

      await supabase
        .from('tokens')
        .delete()
        .eq('user_id', user.id);

      // Finally delete user
      await supabase
        .from('users')
        .delete()
        .eq('id', user.id);
    }

    console.log(`🗑️  Cleanup completed for: ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    return false;
  }
}

/**
 * Seed test data
 */
async function seedTestData() {
  if (!supabase) {
    console.warn('⚠️  Supabase not configured, skipping seeding');
    return;
  }

  console.log('🌱 Seeding test data...');

  const users = [];
  const promises = [];

  // Create test users
  for (let i = 0; i < 5; i++) {
    promises.push(
      createTestUser({
        createProfile: true,
        profile: {
          fullName: `Test User ${i + 1}`
        }
      }).then(user => {
        if (user) users.push(user);
      })
    );
  }

  await Promise.all(promises);
  console.log(`✅ Seeded ${users.length} test users`);
  return users;
}

/**
 * Clear all test data
 */
async function clearTestData() {
  if (!supabase) {
    console.warn('⚠️  Supabase not configured, skipping clear');
    return false;
  }

  console.log('🗑️  Clearing test data...');

  try {
    // Clear OTPs for test numbers
    await supabase
      .from('otps')
      .delete()
      .like('number', '998%'); // Delete test numbers

    // Get all test users
    const { data: testUsers } = await supabase
      .from('users')
      .select('id, phone')
      .like('phone', '998%');

    if (testUsers && testUsers.length > 0) {
      const userIds = testUsers.map(u => u.id);

      // Delete related data
      await supabase
        .from('user_sessions')
        .delete()
        .in('user_id', userIds);

      await supabase
        .from('tokens')
        .delete()
        .in('user_id', userIds);

      // For production, implement soft delete
      // await supabase.from('users').update({ deleted_at: new Date().toISOString() }).in('id', userIds);
      await supabase
        .from('users')
        .delete()
        .in('id', userIds);
    }

    console.log('✅ Test data cleared');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear test data:', error);
    return false;
  }
}

/**
 * Setup test environment
 */
async function setupTestEnvironment() {
  console.log('🔧 Setting up test environment...');

  // Clear existing test data
  await clearTestData();

  // Create fresh test data
  const users = await seedTestData();

  console.log('✅ Test environment ready');
  return users;
}

/**
 * Generate unique test identifier
 */
function generateTestId() {
  return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Verify database connection
 */
async function verifyDatabaseConnection() {
  if (!supabase) {
    console.warn('⚠️  Database connection not available');
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) throw error;
    console.log('✅ Database connection verified');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

module.exports = {
  generateTestPhoneNumber,
  createTestUser,
  createUserProfile,
  createTestOtp,
  getRecentOtp,
  cleanupUserData,
  seedTestData,
  clearTestData,
  setupTestEnvironment,
  generateTestId,
  verifyDatabaseConnection,
  supabase
};