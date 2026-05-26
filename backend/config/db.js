/**
 * config/db.js
 * --------------------------------------------------------------------
 * Connects the backend to MongoDB using Mongoose.
 *
 * Why Mongoose?  It gives us schemas, validation, and a clean API on
 * top of raw MongoDB driver. Required by the project brief.
 *
 * The connection string comes from process.env.MONGO_URI (NEVER
 * hard-coded). server.js calls connectDB() before app.listen().
 * --------------------------------------------------------------------
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI environment variable is not set');
    }

    // Mongoose 8+ no longer needs useNewUrlParser / useUnifiedTopology.
    const conn = await mongoose.connect(uri);

    console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    // Useful runtime listeners — helps debugging in deployment.
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    // Exit so the host platform restarts the process instead of running broken.
    process.exit(1);
  }
};

module.exports = connectDB;
