import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, default: 'user' },
  preferences: {
    emailAlerts: { type: Boolean, default: false },
    projectUpdates: { type: Boolean, default: false },
  },
}, { timestamps: true });

const Client = mongoose.model('Client', clientSchema);

export default Client;