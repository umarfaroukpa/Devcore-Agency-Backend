// const { execSync } = require('child_process');
// const path = require('path');
// console.log('🚀 Starting deployment...');
// console.log(`Environment: ${process.argv[2] || 'production'}`);
// console.log(`Current directory: ${process.cwd()}`);
// try {
//   // 1. Pull latest changes
//   console.log('\n📦 Pulling latest changes...');
//   execSync('git pull', { stdio: 'inherit' });
//   // 2. Install dependencies
//   console.log('\n📦 Installing dependencies...');
//   execSync('npm ci --only=production', { stdio: 'inherit' });
//   // 3. Build the application
//   console.log('\n🔨 Building application...');
//   execSync('npm run build', { stdio: 'inherit' });
//   // 4. Restart the server (adjust based on your setup)
//   console.log('\n🔄 Restarting server...');
//   // For PM2:
//   // execSync('pm2 restart your-app-name', { stdio: 'inherit' });
//   // For systemd:
//   // execSync('sudo systemctl restart your-service', { stdio: 'inherit' });
//   console.log('\n✅ Deployment completed successfully!');
//   process.exit(0);
// } catch (error) {
//   console.error('\n❌ Deployment failed:', error.message);
//   process.exit(1);
// }
