import Payment from '../models/Payment.js';
import Project from '../models/Project.js';
import Client from '../models/Client.js';

// ✅ Create payment
export const createPayment = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { amount, date, description, status, clientId, projectId } = req.body;

    // Ensure client exists
    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Partners can only create payments for their own clients
    if (role === 'partner' && client.createdById && client.createdById !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Ensure project exists if provided
    let project = null;
    if (projectId) {
      project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ message: 'Project not found' });
    }

    const payment = await Payment.create({
      amount,
      date: date || new Date(),
      description,
      status: status || 'pending',
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
          date: payment.date,
          description,
          status: payment.status,
          clientId,
        },
      });
      project.activityLog = activity;
      await project.save();
    }

    res.status(201).json(payment);
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ message: 'Failed to create payment: ' + err.message });
  }
};

// ✅ Get all payments (with role check)
export const getAllPayments = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    let filter = {};
    if (role === 'partner') {
      const partnerClients = await Client.find({ createdById: userId }, '_id');
      const clientIds = partnerClients.map((c) => c._id.toString());
      filter = { clientId: { $in: clientIds } };
    }

    const payments = await Payment.find(filter).sort({ createdAt: -1 });

    // Enrich with Client and Project info if needed
    const clientIds = [...new Set(payments.map((p) => p.clientId).filter(Boolean))];
    const projectIds = [...new Set(payments.map((p) => p.projectId).filter(Boolean))];

    const [clients, projects] = await Promise.all([
      Client.find({ _id: { $in: clientIds } }, 'id name company email createdById'),
      Project.find({ _id: { $in: projectIds } }, 'id title'),
    ]);

    const clientMap = new Map(clients.map((c) => [c.id, c.toJSON()]));
    const projectMap = new Map(projects.map((p) => [p.id, p.toJSON()]));

    const result = payments.map((p) => {
      const json = p.toJSON();
      json.Client = clientMap.get(p.clientId) || null;
      json.Project = projectMap.get(p.projectId) || null;
      return json;
    });

    res.json(result);
  } catch (err) {
    console.error('Fetch payments error:', err);
    res.status(500).json({ message: 'Failed to fetch payments: ' + err.message });
  }
};

// ✅ Get single payment
export const getPaymentById = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { id } = req.params;

    const payment = await Payment.findById(id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const client = await Client.findById(payment.clientId);
    if (role === 'partner' && client && client.createdById !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const project = payment.projectId ? await Project.findById(payment.projectId) : null;

    const json = payment.toJSON();
    json.Client = client ? client.toJSON() : null;
    json.Project = project ? project.toJSON() : null;

    res.json(json);
  } catch (err) {
    console.error('Get payment error:', err);
    res.status(500).json({ message: 'Failed to fetch payment' });
  }
};

// ✅ Update payment
export const updatePayment = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { id } = req.params;
    const { amount, date, description, status, clientId, projectId } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const currentClient = await Client.findById(payment.clientId);
    if (role === 'partner' && currentClient && currentClient.createdById !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let clientName = payment.clientName;
    let projectTitle = payment.projectTitle;

    if (clientId && clientId !== payment.clientId) {
      const client = await Client.findById(clientId);
      if (!client) return res.status(404).json({ message: 'Client not found' });
      if (role === 'partner' && client.createdById !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      clientName = client.name;
    }

    let project = payment.projectId ? await Project.findById(payment.projectId) : null;
    if (projectId && projectId !== payment.projectId) {
      project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ message: 'Project not found' });
      projectTitle = project.title;
    }

    if (amount !== undefined) payment.amount = amount;
    if (date !== undefined) payment.date = date;
    if (description !== undefined) payment.description = description;
    if (status !== undefined) payment.status = status;
    if (clientId !== undefined) payment.clientId = clientId;
    if (projectId !== undefined) payment.projectId = projectId;
    payment.clientName = clientName;
    payment.projectTitle = projectTitle;

    await payment.save();

    // Add activity log to project
    if (project) {
      const activity = project.activityLog || [];
      activity.push({
        id: `${Date.now()}_activity`,
        type: 'payment_updated',
        description: `Payment of ${payment.amount} updated for project "${projectTitle}"`,
        timestamp: new Date().toISOString(),
        details: {
          paymentId: payment.id,
          amount: payment.amount,
          date: payment.date,
          description: payment.description,
          status: payment.status,
        },
      });
      project.activityLog = activity;
      await project.save();
    }

    res.json(payment);
  } catch (err) {
    console.error('Update payment error:', err);
    res.status(500).json({ message: 'Failed to update payment' });
  }
};

// ✅ Delete payment
export const deletePayment = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { id } = req.params;

    const payment = await Payment.findById(id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const client = await Client.findById(payment.clientId);
    if (role === 'partner' && client && client.createdById !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Add activity log to project before deleting
    if (payment.projectId) {
      const project = await Project.findById(payment.projectId);
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
    }

    await Payment.findByIdAndDelete(id);
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    console.error('Delete payment error:', err);
    res.status(500).json({ message: 'Failed to delete payment' });
  }
};
