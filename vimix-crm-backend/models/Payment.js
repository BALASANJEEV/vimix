import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Project from './Project.js';
import Client from './Client.js';

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  date:   { type: DataTypes.DATE,  defaultValue: DataTypes.NOW },
  description: DataTypes.TEXT,
  status: { type: DataTypes.ENUM('paid','pending','overdue'), defaultValue: 'pending' },

  // for quick reporting without joins (optional)
  clientName:  DataTypes.STRING,
  projectTitle:DataTypes.STRING,
}, {
  tableName: 'payments',
  timestamps: true,
});

// Associations
Project.hasMany(Payment, { onDelete: 'CASCADE', foreignKey: 'projectId' });
Payment.belongsTo(Project, { foreignKey: 'projectId' });

Client.hasMany(Payment, { onDelete: 'CASCADE', foreignKey: 'clientId' });
Payment.belongsTo(Client, { foreignKey: 'clientId' });

const updateTotals = async (payment) => {
  // Update Project totalPayments
  if (payment.projectId) {
    const total = await Payment.sum("amount", {
      where: { projectId: payment.projectId, status: "paid" },
    });
    await Project.update(
      { totalPayments: total || 0 },
      { where: { id: payment.projectId } }
    );
  }

  // Update Client totalPayments
  if (payment.clientId) {
    const total = await Payment.sum("amount", {
      where: { clientId: payment.clientId, status: "paid" },
    });
    await Client.update(
      { totalPayments: total || 0 },
      { where: { id: payment.clientId } }
    );
  }
};

Payment.afterCreate(updateTotals);
Payment.afterUpdate(updateTotals);
Payment.afterDestroy(updateTotals);

export default Payment;
