import { PrismaClient } from '@prisma/client';

async function testConnection() {
  const prisma = new PrismaClient();

  try {
    console.log('Testing connection to Supabase...');

    // Test 1: Basic connection test
    await prisma.$connect();
    console.log('✅ Successfully connected to Supabase');

    // Test 2: Query test
    const result = await prisma.$queryRaw`SELECT current_database(), current_user, version()`;
    console.log('\n📊 Database info:');
    console.log(`- Database: ${result[0].current_database}`);
    console.log(`- User: ${result[0].current_user}`);
    console.log(`- PostgreSQL version: ${result[0].version.split(' ')[1]}`);

    // Test 3: Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'appointments', 'ai_sessions')
    `;

    console.log('\n📋 Found tables:');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });

    if (tables.length === 0) {
      console.log('\n⚠️  No tables found! You may need to run migrations.');
    }

    console.log('\n✅ All tests passed!');

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    if (error.code === 'P1001') {
      console.error('   - Cannot connect to database server');
    } else if (error.code === 'P1000') {
      console.error('   - Authentication failed');
    } else if (error.code === 'P1002') {
      console.error('   - Database connection timeout');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Connection closed.');
  }
}

// Run the test
testConnection();