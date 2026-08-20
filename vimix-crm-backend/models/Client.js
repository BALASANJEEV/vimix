import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const PROJECT_STAGES = [
  "enquiry",
  "sow-provided",
  "proposal-sent",
  "negotiation",
  "prototyping",
  "signed-agreement",
  "closed",
  "deal-lost",
];

const Client = sequelize.define(
  "Client",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    phone: DataTypes.STRING,
    company: DataTypes.STRING,
    stage: {
      type: DataTypes.ENUM(...PROJECT_STAGES),
      defaultValue: "enquiry",
    },
    notes: DataTypes.TEXT,
    totalPayments: { type: DataTypes.FLOAT, defaultValue: 0 },
    stageHistory: { type: DataTypes.JSONB, defaultValue: [] },
    activityLog: { type: DataTypes.JSONB, defaultValue: [] },

    // 🔹 Added fields to track who created this client
    createdById: {
      type: DataTypes.UUID,
    },
    createdByRole: {
      type: DataTypes.ENUM("admin", "partner"),
    },
  },
  {
    tableName: "clients",
    timestamps: true,
  }
);

export default Client;
