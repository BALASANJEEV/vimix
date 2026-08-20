import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SERVICE_TYPES = [
  'app-development','vapt-testing','compliance',
  'business-intelligence','bi-visualization',
  'video-editing','market-consulting'
];

const PROJECT_STAGES = [
  'enquiry','sow-provided','proposal-sent',
  'negotiation','prototyping','signed-agreement',
  'closed','deal-lost'
];

const PRIORITY_LEVELS = [
  'low', 'medium', 'high', 'urgent'
];

const Project = sequelize.define('Project', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  service: { type: DataTypes.ENUM(...SERVICE_TYPES), allowNull: false },
  stage: { type: DataTypes.ENUM(...PROJECT_STAGES), allowNull: false, defaultValue: 'enquiry' },
  priority: { type: DataTypes.ENUM(...PRIORITY_LEVELS), allowNull: false, defaultValue: 'medium' },
  description: DataTypes.TEXT,
  budget: DataTypes.FLOAT,
  deadline: DataTypes.DATE,
  totalPayments: { type: DataTypes.FLOAT, defaultValue: 0 },
  documents:    { type: DataTypes.JSONB },
  meetings:     { type: DataTypes.JSONB },
  stageHistory: { type: DataTypes.JSONB },
  activityLog:  { type: DataTypes.JSONB },
}, {
  tableName: 'projects',
  timestamps: true
});

export default Project;