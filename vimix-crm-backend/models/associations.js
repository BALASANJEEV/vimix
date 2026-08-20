import Client from './Client.js';
import Project from './Project.js';
import Payment from './Payment.js'; // if using payments
import Partner from './Partner.js';

// Client <-> Project
Client.hasMany(Project, { as: 'projects', foreignKey: 'clientId', onDelete: 'CASCADE' });
Project.belongsTo(Client, { as: 'client', foreignKey: 'clientId' });

// Project <-> Payment
Project.hasMany(Payment, { as: 'payments', foreignKey: 'projectId', onDelete: 'CASCADE' });
Payment.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });

// Partner <-> Project (partner can own created projects)
Partner.hasMany(Project, { as: 'projects', foreignKey: 'partnerId', onDelete: 'SET NULL' });
Project.belongsTo(Partner, { as: 'partner', foreignKey: 'partnerId' });
