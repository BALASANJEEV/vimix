import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import Admin from '../models/Admin.js';
import Partner from '../models/Partner.js';

export const loginAdmin = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const identifier = username || email;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Username/email and password are required' });
    }

    // Try to find in Admin table first using username or email
    let user = await Admin.findOne({
      where: {
        [Op.or]: [{ username: identifier }, { email: identifier }],
      },
    });
    let role = 'admin';

    // If not found in Admin, try Partner
    if (!user) {
      user = await Partner.findOne({
        where: {
          [Op.or]: [{ username: identifier }, { email: identifier }],
        },
      });
      role = 'partner';
    }

    // If still not found
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT with role info
    const token = jwt.sign(
      { id: user.id, username: user.username, role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Optional: include role in response for frontend usage
    res.json({
      token,
      role,
      name: user.name || user.username,
      message: `${role} login successful`,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(req.body);

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const existing = await Admin.findOne({ where: { username } });
    if (existing) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ username, password: hashedPassword });

    return res.status(201).json({
      id: admin.id,
      username: admin.username,
      message: 'Admin created successfully',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Admin-only partner management
export const getAllPartners = async (req, res) => {
  try {
    const partners = await Partner.findAll({
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] }
    });
    res.json(partners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPartnerById = async (req, res) => {
  try {
    const partner = await Partner.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    if (!partner) return res.status(404).json({ message: 'Partner not found' });
    res.json(partner);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createPartner = async (req, res) => {
  try {
    const { name, email, company, username, password } = req.body;
    if (!name || !email || !username || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await Partner.findOne({ where: { username } });
    if (existing) return res.status(409).json({ message: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const partner = await Partner.create({ name, email, company, username, password: hashedPassword });
    
    res.status(201).json({
      id: partner.id,
      name: partner.name,
      email: partner.email,
      company: partner.company,
      username: partner.username,
      isActive: partner.isActive
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, company, username, password, isActive } = req.body;

    const partner = await Partner.findByPk(id);
    if (!partner) return res.status(404).json({ message: 'Partner not found' });

    const updateData = { name, email, company, username, isActive };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await partner.update(updateData);
    
    res.json({
      id: partner.id,
      name: partner.name,
      email: partner.email,
      company: partner.company,
      username: partner.username,
      isActive: partner.isActive
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deletePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Partner.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ message: 'Partner not found' });
    res.json({ message: 'Partner deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
