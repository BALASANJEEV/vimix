import React, { useState, useEffect } from "react";
import axios from "axios";

const Settings: React.FC = () => {
  const [userId, setUserId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [emailAlerts, setEmailAlerts] = useState<boolean>(false);
  const [projectUpdates, setProjectUpdates] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get userId from localStorage (assuming it's set on login)
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  // Fetch user data and preferences from MongoDB
  useEffect(() => {
    if (!userId) return;
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/clients/${userId}`);
        const data = response.data;
        setName(data.name || '');
        setEmail(data.email || '');
        setRole(data.role || '');
        // Preferences fields may be stored directly on the client document
        setEmailAlerts(!!data.preferences?.emailAlerts);
        setProjectUpdates(!!data.preferences?.projectUpdates);
      } catch (err) {
        console.error('Failed to fetch user data', err);
        setError('Unable to load settings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const handleSave = async () => {
    if (!userId) {
      setError('User ID not found. Please log in again.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      // Send updated profile and preferences to backend
      const payload = {
        name,
        email,
        preferences: {
          emailAlerts,
          projectUpdates,
        },
      };
      await axios.put(`/api/clients/${userId}`, payload);
      setSuccessMessage('Preferences saved successfully!');
      // Optionally clear success message after a few seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Failed to save preferences', err);
      setError('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-4xl mx-auto px-4">
        {/* Settings Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-3xl font-bold text-gray-800">Settings</h2>
          </div>

          <div className="p-6 space-y-8">
            {/* Profile Section */}
            <section>
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>

            {/* Notification Preferences Section */}
            <section>
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label htmlFor="emailAlerts" className="text-gray-700 font-medium">Email alerts</label>
                  <input
                    id="emailAlerts"
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label htmlFor="projectUpdates" className="text-gray-700 font-medium">Project updates</label>
                  <input
                    id="projectUpdates"
                    type="checkbox"
                    checked={projectUpdates}
                    onChange={(e) => setProjectUpdates(e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>

          {/* Success/Error Messages */}
          {error && (
            <div className="px-6 pb-4">
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            </div>
          )}
          {successMessage && (
            <div className="px-6 pb-4">
              <div className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg p-3">
                {successMessage}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
