import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const [userData, setUserData] = useState({ name: '', email: '', theme: 'light' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await apiClient.get('/user/profile'); // Assuming this endpoint exists
        setUserData(response.data);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.put('/user/profile', userData); // Assuming this endpoint exists
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="settings-container">
      <h2 className="text-2xl font-bold">Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            type="text"
            name="name"
            value={userData.name}
            onChange={handleChange}
            className="input"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={userData.email}
            onChange={handleChange}
            className="input"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Theme</label>
          <select
            name="theme"
            value={userData.theme}
            onChange={handleChange}
            className="input"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <button type="submit" className="btn">Save Changes</button>
      </form>
    </div>
  );
};

export default Settings;