import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Partner from '../models/Partner.js';
import Project from '../models/Project.js';

export const registerPartner = async (req, res) => {
  try {
    const { name, email, company, username, password } = req.body;
    if (!name || !email || !username || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const existing = await Partner.findOne({
      $or: [{ username: username.trim() }, { email: email.trim() }],
    });
    if (existing) return res.status(409).json({ message: 'Username or email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const partner = await Partner.create({
      name: name.trim(),
      email: email.trim(),
      company,
      username: username.trim(),
      password: hashed,
    });
    res.status(201).json({ id: partner.id, username: partner.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const loginPartner = async (req, res) => {
  try {
    const { username, password } = req.body;
    const identifier = (username || '').trim();
    const partner = await Partner.findOne({
      $or: [{ username: identifier }, { email: identifier }],
      isActive: true,
    });
    if (!partner) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, partner.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign(
      { id: partner.id || partner._id.toString(), role: 'partner', username: partner.username },
      process.env.JWT_SECRET || 'vimix-local-dev-jwt-secret',
      { expiresIn: '2d' }
    );
    res.json({ token, role: 'partner', name: partner.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Partners can only create enquiry-stage projects and are auto-assigned as owner
export const createPartnerProject = async (req, res) => {
  try {
    const partnerId = req.user?.id;
    const { clientId, title, service, description, budget, deadline } = req.body;
    if (!clientId || !title || !service) {
      return res.status(400).json({ message: 'clientId, title and service are required' });
    }

    const project = await Project.create({
      clientId,
      title,
      service,
      stage: 'enquiry',
      description,
      budget,
      deadline,
      stageHistory: [{ stage: 'enquiry', date: new Date().toISOString().split('T')[0] }],
      activityLog: [
        {
          id: `${Date.now()}_activity`,
          type: 'project_created',
          description: 'Project created by partner',
          timestamp: new Date().toISOString(),
          details: { createdBy: 'partner' },
        },
      ],
      documents: {},
      meetings: [],
      totalPayments: 0,
      partnerId,
    });
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
