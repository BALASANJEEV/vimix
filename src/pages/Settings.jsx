import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Settings.css';

const Settings = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    emailAlerts: false,
    projectUpdates: false,
    weeklyDigest: false,
    marketingEmails: false
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserPreferences();
  }, []);

  const fetchUserPreferences = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setLoading(false);
        return;
      }
      const response = await axios.get(`http://localhost:5000/api/users/${userId}/preferences`);
      if (response.data) {
        setFormData(prev => ({
          ...prev,
          name: response.data.name || '',
          email: response.data.email || '',
          emailAlerts: response.data.preferences?.emailAlerts || false,
          projectUpdates: response.data.preferences?.projectUpdates || false,
          weeklyDigest: response.data.preferences?.weeklyDigest || false,
          marketingEmails: response.data.preferences?.marketingEmails || false
        }));
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setMessage('Please log in to save preferences.');
        setMessageType('error');
        return;
      }

      await axios.put(`http://localhost:5000/api/users/${userId}/preferences`, {
        name: formData.name,
        email: formData.email,
        preferences: {
          emailAlerts: formData.emailAlerts,
          projectUpdates: formData.projectUpdates,
          weeklyDigest: formData.weeklyDigest,
          marketingEmails: formData.marketingEmails
        }
      });

      setMessage('Preferences saved successfully!');
      setMessageType('success');
      
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Failed to save preferences. Please try again.');
      setMessageType('error');
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-loading">
          <div className="loading-spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage your account preferences and notifications</p>
        </div>

        {message && (
          <div className={`settings-message ${messageType}`}>
            <span className="message-icon">{messageType === 'success' ? '✓' : '✕'}</span>
            {message}
          </div>
        )}

        <div className="settings-grid">
          {/* Profile Section */}
          <div className="settings-card">
            <div className="card-header">
              <div className="card-icon">👤</div>
              <h2>Profile Information</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="form-input"
                  />
                </div>
              </form>
            </div>
          </div>

          {/* Notification Preferences Section */}
          <div className="settings-card">
            <div className="card-header">
              <div className="card-icon">🔔</div>
              <h2>Notification Preferences</h2>
            </div>
            <div className="card-body">
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="emailAlerts"
                    checked={formData.emailAlerts}
                    onChange={handleChange}
                    className="checkbox-input"
                  />
                  <span className="checkbox-custom"></span>
                  <div className="checkbox-content">
                    <span className="checkbox-title">Email Alerts</span>
                    <span className="checkbox-description">Receive alerts via email for important updates</span>
                  </div>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="projectUpdates"
                    checked={formData.projectUpdates}
                    onChange={handleChange}
                    className="checkbox-input"
                  />
                  <span className="checkbox-custom"></span>
                  <div className="checkbox-content">
                    <span className="checkbox-title">Project Updates</span>
                    <span className="checkbox-description">Get notified when projects are updated or completed</span>
                  </div>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="weeklyDigest"
                    checked={formData.weeklyDigest}
                    onChange={handleChange}
                    className="checkbox-input"
                  />
                  <span className="checkbox-custom"></span>
                  <div className="checkbox-content">
                    <span className="checkbox-title">Weekly Digest</span>
                    <span className="checkbox-description">Receive a weekly summary of your activity</span>
                  </div>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="marketingEmails"
                    checked={formData.marketingEmails}
                    onChange={handleChange}
                    className="checkbox-input"
                  />
                  <span className="checkbox-custom"></span>
                  <div className="checkbox-content">
                    <span className="checkbox-title">Marketing Emails</span>
                    <span className="checkbox-description">Receive news about new features and promotions</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="settings-actions">
          <button type="submit" onClick={handleSubmit} className="save-button">
            <span className="button-icon">💾</span>
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;