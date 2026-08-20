import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Partner from '../models/Partner.js';

export const loginAdmin = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const identifier = (username || email || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Username/email and password are required' });
    }

    // Try to find in Admin collection first
    let user = await Admin.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });
    let role = 'admin';

    // If not found in Admin, try Partner
    if (!user) {
      user = await Partner.findOne({
        $or: [{ username: identifier }, { email: identifier }],
      });
      role = 'partner';
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (role === 'partner' && user.isActive === false) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id || user._id.toString(), username: user.username, role },
      process.env.JWT_SECRET || 'vimix-local-dev-jwt-secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      role,
      name: user.name || user.username,
      username: user.username,
      email: user.email,
      message: `${role} login successful`,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const registerAdmin = async (req, res) => {
  try {
    const { username, password, email, name, role = 'admin' } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email ? email.trim() : trimmedUsername;

    // Check existing admin or partner
    const existingAdmin = await Admin.findOne({
      $or: [{ username: trimmedUsername }, { email: trimmedEmail }],
    });
    if (existingAdmin) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }

    const existingPartner = await Partner.findOne({
      $or: [{ username: trimmedUsername }, { email: trimmedEmail }],
    });
    if (existingPartner) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      username: trimmedUsername,
      email: trimmedEmail,
      name: name || trimmedUsername,
      password: hashedPassword,
      role,
    });

    const token = jwt.sign(
      { id: admin.id || admin._id.toString(), username: admin.username, role },
      process.env.JWT_SECRET || 'vimix-local-dev-jwt-secret',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      role,
      name: admin.name || admin.username,
      username: admin.username,
      email: admin.email,
      id: admin.id,
      message: 'Account created successfully',
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

export const createAdmin = registerAdmin;

// Admin-only partner management
export const getAllPartners = async (req, res) => {
  try {
    const partners = await Partner.find({}, { password: 0 }).sort({ createdAt: -1 });
    res.json(partners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPartnerById = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id, { password: 0 });
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

    const existing = await Partner.findOne({ username: username.trim() });
    if (existing) return res.status(409).json({ message: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const partner = await Partner.create({
      name: name.trim(),
      email: email.trim(),
      company,
      username: username.trim(),
      password: hashedPassword,
    });

    res.status(201).json({
      id: partner.id,
      name: partner.name,
      email: partner.email,
      company: partner.company,
      username: partner.username,
      isActive: partner.isActive,
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

    const partner = await Partner.findById(id);
    if (!partner) return res.status(404).json({ message: 'Partner not found' });

    if (name) partner.name = name.trim();
    if (email) partner.email = email.trim();
    if (company !== undefined) partner.company = company;
    if (username) partner.username = username.trim();
    if (isActive !== undefined) partner.isActive = isActive;
    if (password) {
      partner.password = await bcrypt.hash(password, 10);
    }

    await partner.save();

    res.json({
      id: partner.id,
      name: partner.name,
      email: partner.email,
      company: partner.company,
      username: partner.username,
      isActive: partner.isActive,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deletePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Partner.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Partner not found' });
    res.json({ message: 'Partner deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
