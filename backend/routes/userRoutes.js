const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get user preferences
router.get('/:id/preferences', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      name: user.name,
      email: user.email,
      preferences: user.preferences || {
        emailAlerts: false,
        projectUpdates: false,
        weeklyDigest: false,
        marketingEmails: false
      }
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user preferences
router.put('/:id/preferences', async (req, res) => {
  try {
    const { name, email, preferences } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (preferences !== undefined) updateData.preferences = preferences;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'Preferences saved successfully!',
      name: user.name,
      email: user.email,
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;