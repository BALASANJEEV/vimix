import mongoose from 'mongoose';

export const PROJECT_STAGES = [
  'enquiry',
  'sow-provided',
  'proposal-sent',
  'negotiation',
  'prototyping',
  'signed-agreement',
  'closed',
  'deal-lost',
];

const ClientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    stage: {
      type: String,
      enum: PROJECT_STAGES,
      default: 'enquiry',
    },
    notes: {
      type: String,
    },
    totalPayments: {
      type: Number,
      default: 0,
    },
    stageHistory: {
      type: Array,
      default: [],
    },
    activityLog: {
      type: Array,
      default: [],
    },
    createdById: {
      type: String,
    },
    createdByRole: {
      type: String,
      enum: ['admin', 'partner'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Client = mongoose.models.Client || mongoose.model('Client', ClientSchema);

export default Client;
