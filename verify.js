import { PrismaClient } from '@prisma/client';

async function main() {
  console.log('--- Environment Variables Check ---');
  console.log('DATABASE_URL is set:', !!process.env.DATABASE_URL);
  console.log('JWT_SECRET is set:', !!process.env.JWT_SECRET);
  console.log('CLIENT_URL is set:', !!process.env.CLIENT_URL);
  console.log('VITE_API_URL is set:', !!process.env.VITE_API_URL);
  console.log('PORT is set:', process.env.PORT || 'default 3000');

  console.log('\n--- Database Connection Check ---');
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is missing!');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('✅ Successfully connected to PostgreSQL via Prisma!');
  } catch (err) {
    console.error('❌ Failed to connect to the database:');
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
