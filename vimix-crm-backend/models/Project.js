import mongoose from 'mongoose';

export const SERVICE_TYPES = [
  'app-development',
  'vapt-testing',
  'compliance',
  'business-intelligence',
  'bi-visualization',
  'video-editing',
  'market-consulting',
];

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

export const PRIORITY_LEVELS = ['low', 'medium', 'high', 'urgent', 'normal'];

const ProjectSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      ref: 'Client',
      required: true,
    },
    partnerId: {
      type: String,
      ref: 'Partner',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    service: {
      type: String,
      enum: SERVICE_TYPES,
      required: true,
    },
    stage: {
      type: String,
      enum: PROJECT_STAGES,
      default: 'enquiry',
    },
    priority: {
      type: String,
      enum: PRIORITY_LEVELS,
      default: 'medium',
    },
    description: {
      type: String,
    },
    budget: {
      type: Number,
      default: 0,
    },
    deadline: {
      type: Date,
    },
    totalPayments: {
      type: Number,
      default: 0,
    },
    documents: {
      type: Object,
      default: {},
    },
    meetings: {
      type: Array,
      default: [],
    },
    stageHistory: {
      type: Array,
      default: [],
    },
    activityLog: {
      type: Array,
      default: [],
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

const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);

export default Project;