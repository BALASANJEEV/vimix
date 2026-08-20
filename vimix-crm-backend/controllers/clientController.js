import Client from '../models/Client.js';
import Project from '../models/Project.js';
import Payment from '../models/Payment.js';

/** Create a new client */
export const createClient = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    const { id, ...clientData } = req.body;

    const client = await Client.create({
      ...clientData,
      createdById: userId,
      createdByRole: role,
    });

    res.status(201).json({
      message: "Client created successfully",
      client,
    });
  } catch (err) {
    console.error("Create client error:", err);
    res.status(400).json({ message: err.message });
  }
};

/** Get all clients */
export const getClients = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    const whereClause = role === 'partner' ? { createdById: userId } : {};

    const clients = await Client.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.json(clients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/** Get one client */
export const getClient = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const client = await Client.findByPk(req.params.id);

    if (!client) return res.status(404).json({ message: 'Client not found' });

    if (role === 'partner' && client.createdById !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/** Update client */
export const updateClient = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    if (role === 'partner' && client.createdById !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await client.update(req.body);
    res.json(client);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

/** Delete client */
export const deleteClient = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    if (role === 'partner' && client.createdById !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await client.destroy();
    res.json({ message: 'Client removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/** Get client details with projects and payments */
export const getClientDetails = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { id } = req.params;

    const client = await Client.findByPk(id, {
      include: [{
        model: Project,
        as: 'projects',
        include: [{ model: Payment, as: 'payments' }],
        order: [['createdAt', 'DESC']]
      }]
    });

    if (!client) return res.status(404).json({ message: 'Client not found' });

    if (role === 'partner' && client.createdById !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const projects = client.projects.map(p => {
      const plain = p.toJSON();
      delete plain.payments;
      return plain;
    });

    const payments = client.projects.flatMap(p =>
      p.payments ? p.payments.map(pay => pay.toJSON()) : []
    );

    res.json({
      client: client.toJSON(),
      projects,
      payments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
