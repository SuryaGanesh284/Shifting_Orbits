const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

let isConnected = false;

const connectDB = async (customUri = null) => {
  if (isConnected) {
    logger.debug('Using existing MongoDB connection');
    return mongoose.connection;
  }

  const uri = customUri || env.MONGO_URI;

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000
    });

    isConnected = true;
    logger.info(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection lost. Reconnecting...');
      isConnected = false;
    });

    return conn;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error.message);
    if (env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info('MongoDB disconnected gracefully');
};

module.exports = { connectDB, disconnectDB };
