require('dotenv').config();
const app = require('./config/app');
const { testConnection, runMigrations } = require('./config/database');

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await testConnection();
    await runMigrations();
    app.listen(PORT, () => {
      console.log(`✓ Server running  → http://localhost:${PORT}`);
      console.log(`✓ Environment     → ${process.env.NODE_ENV}`);
      console.log(`✓ API base        → http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
