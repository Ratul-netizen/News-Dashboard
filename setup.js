#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up News Dashboard...\n');

try {
  // Check if Prisma is installed
  console.log('📦 Checking Prisma installation...');
  execSync('npx prisma --version', { stdio: 'inherit' });
  
  // Generate Prisma client
  console.log('\n🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Push database schema
  console.log('\n🗄️  Setting up database...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  // Check if database file exists
  const dbPath = path.join(__dirname, 'prisma', 'dev.db');
  if (fs.existsSync(dbPath)) {
    console.log('\n✅ Database file exists');
  } else {
    console.log('\n⚠️  Database file not found, but this might be normal for first run');
  }
  
  console.log('\n🎉 Setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Open http://localhost:3000 in your browser');
  console.log('3. Use the "Refresh Data" button to fetch initial data');
  console.log('4. Data will auto-refresh every 5 minutes');
  
} catch (error) {
  console.error('\n❌ Setup failed:', error.message);
  console.log('\n💡 Try running these commands manually:');
  console.log('npx prisma generate');
  console.log('npx prisma db push');
  process.exit(1);
}
