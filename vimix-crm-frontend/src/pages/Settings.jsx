import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUser, FaBell, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import './Settings.css';

const Settings = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: ''
  });
  const [preferences, setPreferences] = useState({
    emailAlerts: false,
    projectUpdates: false
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userId) {
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data) {
        setProfile({
          name: response.data.name || '',
          email: response.data.email || ''
        });
        setPreferences({
          emailAlerts: response.data.preferences?.emailAlerts || false,
          projectUpdates: response.data.preferences?.projectUpdates || false
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      showMessage('error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const handlePreferenceChange = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      if (!token || !userId) {
        showMessage('error', 'Please log in to save preferences');
        return;
      }

      await axios.put(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/${userId}/preferences`,
        { preferences },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showMessage('success', 'Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      showMessage('error', 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-loading">
          <div className="spinner"></div>
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
          <p className="settings-subtitle">Manage your account settings and preferences</p>
        </div>

        {message.text && (
          <div className={`settings-message ${message.type}`}>
            {message.type === 'success' ? <FaCheck /> : <FaExclamationTriangle />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="settings-cards">
          {/* Profile Card */}
          <div className="settings-card">
            <div className="card-header">
              <div className="card-icon">
                <FaUser />
              </div>
              <div className="card-title-section">
                <h2>Profile Information</h2>
                <p>Update your personal details</p>
              </div>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  className="form-input"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Enter your name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="Enter your email"
                />
              </div>
            </div>
          </div>

          {/* Notification Preferences Card */}
          <div className="settings-card">
            <div className="card-header">
              <div className="card-icon notification-icon">
                <FaBell />
              </div>
              <div className="card-title-section">
                <h2>Notification Preferences</h2>
                <p>Choose what notifications you want to receive</p>
              </div>
            </div>
            <div className="card-body">
              <div className="preference-item">
                <div className="preference-info">
                  <h3>Email Alerts</h3>
                  <p>Receive email notifications for important updates</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.emailAlerts}
                    onChange={() => handlePreferenceChange('emailAlerts')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="preference-item">
                <div className="preference-info">
                  <h3>Project Updates</h3>
                  <p>Get notified when projects are updated or completed</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.projectUpdates}
                    onChange={() => handlePreferenceChange('projectUpdates')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="card-actions">
                <button
                  className="save-button"
                  onClick={handleSavePreferences}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="button-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaCheck /> Save Preferences
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;