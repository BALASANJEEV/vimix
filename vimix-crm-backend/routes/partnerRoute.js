import express from 'express';
import Partner from '../models/Partner.js';

const router = express.Router();

// Get all partners
router.get('/', async (req, res) => {
  try {
    const partners = await Partner.find().sort({ createdAt: -1 });
    res.json(partners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get partner by ID
router.get('/:id', async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    res.json(partner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new partner
router.post('/', async (req, res) => {
  try {
    const { name, email, company, username, password, role, emailAlerts, projectUpdates } = req.body;
    
    const partner = new Partner({
      name,
      email,
      company,
      username,
      password,
      role,
      emailAlerts,
      projectUpdates,
    });
    
    const savedPartner = await partner.save();
    res.status(201).json(savedPartner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update partner
router.put('/:id', async (req, res) => {
  try {
    const { name, email, company, username, password, role, isActive } = req.body;
    
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    
    if (name) partner.name = name;
    if (email) partner.email = email;
    if (company !== undefined) partner.company = company;
    if (username) partner.username = username;
    if (password) partner.password = password;
    if (role) partner.role = role;
    if (isActive !== undefined) partner.isActive = isActive;
    
    const updatedPartner = await partner.save();
    res.json(updatedPartner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update partner notification preferences
router.put('/:id/preferences', async (req, res) => {
  try {
    const { emailAlerts, projectUpdates } = req.body;
    
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    
    if (emailAlerts !== undefined) partner.emailAlerts = emailAlerts;
    if (projectUpdates !== undefined) partner.projectUpdates = projectUpdates;
    
    const updatedPartner = await partner.save();
    res.json(updatedPartner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete partner
router.delete('/:id', async (req, res) => {
  try {
    const partner = await Partner.findByIdAndDelete(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    res.json({ message: 'Partner deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;