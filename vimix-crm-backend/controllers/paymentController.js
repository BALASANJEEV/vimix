import Payment from '../models/Payment.js';
import Project from '../models/Project.js';
import Client from '../models/Client.js';

// ✅ Create payment
export const createPayment = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { amount, date, description, status, clientId, projectId } = req.body;

    // Ensure client exists
    const client = await Client.findByPk(clientId);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Partners can only create payments for their own clients
    if (role === 'partner' && client.createdById !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Ensure project exists if provided
    let project = null;
    if (projectId) {
      project = await Project.findByPk(projectId);
      if (!project) return res.status(404).json({ message: 'Project not found' });
    }

    const payment = await Payment.create({
      amount,
      date,
      description,
      status,
      clientId,
      projectId,
      clientName: client.name,
      projectTitle: project ? project.title : null,
    });

    // Add activity log to project
    if (project) {
      const activity = project.activityLog || [];
      activity.push({
        id: `${Date.now()}_activity`,
        type: 'payment_created',
        description: `Payment of ${amount} created for project "${project.title}"`,
        timestamp: new Date().toISOString(),
        details: {
          paymentId: payment.id,
          amount,
          date,
          description,
          status,
          clientId,
        },
      });
      project.activityLog = activity;
      await project.save();
    }

    res.status(201).json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create payment' });
  }
};

// ✅ Get all payments (with role check)
export const getAllPayments = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    const whereClause = {};
    if (role === 'partner') {
      // Only payments whose client was created by this partner
      whereClause['$Client.createdById$'] = userId;
    }

    const payments = await Payment.findAll({
      include: [
        { model: Client, attributes: ['id', 'name', 'company', 'email', 'createdById'], required: true },
        { model: Project, attributes: ['id', 'title'] },
      ],
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });

    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
};

// ✅ Get single payment
export const getPaymentById = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { id } = req.params;

    const payment = await Payment.findByPk(id, {
      include: [
        { model: Client, attributes: ['id', 'name', 'company', 'email', 'createdById'], required: true },
        { model: Project, attributes: ['id', 'title'] },
      ],
    });

    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    if (role === 'partner' && payment.Client.createdById !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch payment' });
  }
};

// ✅ Update payment
export const updatePayment = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { id } = req.params;
    const { amount, date, description, status, clientId, projectId } = req.body;

      const payment = await Payment.findByPk(id, {
      include: [
        { model: Client, attributes: ['id', 'createdById'], required: true },
        { model: Project, attributes: ['id', 'title', 'activityLog'] },
      ],
    });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    // Partners can only update payments for their own clients
    if (role === 'partner' && payment.Client.createdById !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update client/project info if changed
    let clientName = payment.clientName;
    let projectTitle = payment.projectTitle;
     let project = payment.Project;

    if (clientId) {
      const client = await Client.findByPk(clientId);
      if (!client) return res.status(404).json({ message: 'Client not found' });
      // Partners cannot assign to another partner's client
      if (role === 'partner' && client.createdById !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      clientName = client.name;
    }

    if (projectId) {
      const project = await Project.findByPk(projectId);
      if (!project) return res.status(404).json({ message: 'Project not found' });
      projectTitle = project.title;
    }

    await payment.update({
      amount,
      date,
      description,
      status,
      clientId,
      projectId,
      clientName,
      projectTitle,
    });

    // Add activity log to project
    if (project) {
      const activity = project.activityLog || [];
      activity.push({
        id: `${Date.now()}_activity`,
        type: 'payment_updated',
        description: `Payment of ${amount} updated for project "${projectTitle}"`,
        timestamp: new Date().toISOString(),
        details: {
          paymentId: payment.id,
          amount,
          date,
          description,
          status,
        },
      });
      project.activityLog = activity;
      await project.save();
    }

    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update payment' });
  }
};

// ✅ Delete payment
export const deletePayment = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { id } = req.params;

    const payment = await Payment.findByPk(id, {
      include: [
        { model: Client, attributes: ['id', 'createdById'], required: true },
        { model: Project, attributes: ['id', 'title', 'activityLog'] },
      ],
    });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    // Partners can only delete payments for their own clients
    if (role === 'partner' && payment.Client.createdById !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Add activity log to project before deleting
    const project = payment.Project;
    if (project) {
      const activity = project.activityLog || [];
      activity.push({
        id: `${Date.now()}_activity`,
        type: 'payment_deleted',
        description: `Payment of ${payment.amount} deleted from project "${project.title}"`,
        timestamp: new Date().toISOString(),
        details: { paymentId: payment.id },
      });
      project.activityLog = activity;
      await project.save();
    }

    await payment.destroy();
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete payment' });
  }
};
