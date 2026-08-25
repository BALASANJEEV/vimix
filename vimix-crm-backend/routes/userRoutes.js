const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user preferences
router.put('/:id/preferences', auth, async (req, res) => {
  try {
    const { preferences } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update preferences with new values
    user.preferences = {
      ...user.preferences,
      emailAlerts: preferences.emailAlerts,
      projectUpdates: preferences.projectUpdates
    };

    await user.save();
    
    res.json({
      message: 'Preferences saved successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Error saving preferences:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user preferences
router.get('/:id/preferences', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.preferences || {
      emailAlerts: false,
      projectUpdates: false
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;