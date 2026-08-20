import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

// Fix for Windows / Node SRV resolution issues with mongodb+srv
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // ignore if dns server setting is unsupported in environment
}

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vimix:vimix@cluster0.vvgdhov.mongodb.net/vimix_crm?retryWrites=true&w=majority&appName=Cluster0';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

export default mongoose;
