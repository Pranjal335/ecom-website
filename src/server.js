const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 8000;

console.log('1. Starting bootstrap process...');

const startServer = async () => {
  try {
    console.log('2. Attempting database connection...');
    await connectDB();
    console.log('3. Database connected successfully!');

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`4. ⚙️  Server listening on http://127.0.0.1:${PORT}`);
    });

    const exitHandler = () => {
      if (server) {
        server.close(() => {
          console.log('Server shut down cleanly.');
          process.exit(0);
        });
      }
    };

    process.on('SIGTERM', exitHandler);
    process.on('SIGINT', exitHandler);
  } catch (error) {
    console.error('CRITICAL: Server startup failed:', error);
    process.exit(1);
  }
};

startServer();