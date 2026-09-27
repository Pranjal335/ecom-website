const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 8000;

// Connect to DB and start listening
connectDB()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`⚙️  Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    // Graceful shutdown handling
    const exitHandler = () => {
      if (server) {
        server.close(() => {
          console.log('Server closed.');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    };

    process.on('SIGTERM', exitHandler);
    process.on('SIGINT', exitHandler);
  })
  .catch((err) => {
    console.error('Server startup failed:', err);
  });