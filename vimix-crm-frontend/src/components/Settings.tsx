import React, { useState, useEffect } from "react";

const Settings: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [emailAlerts, setEmailAlerts] = useState<boolean>(false);
  const [projectUpdates, setProjectUpdates] = useState<boolean>(false);

  useEffect(() => {
    const storedName = localStorage.getItem('name');
    const storedEmail = localStorage.getItem('email');
    const storedRole = localStorage.getItem('role');
    const storedPrefs = localStorage.getItem('preferences');

    if (storedName) setName(storedName);
    if (storedEmail) setEmail(storedEmail);
    if (storedRole) setRole(storedRole);

    if (storedPrefs) {
      try {
        const prefs = JSON.parse(storedPrefs);
        setEmailAlerts(!!prefs.emailAlerts);
        setProjectUpdates(!!prefs.projectUpdates);
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const handleSave = () => {
    const prefs = {
      emailAlerts,
      projectUpdates,
    };
    localStorage.setItem('preferences', JSON.stringify(prefs));
    alert('Preferences saved');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">Settings</h2>

      <section className="mb-6">
        <h3 className="text-xl font-medium mb-2">Profile Overview</h3>
        <div className="grid grid-cols-1 gap-2">
          <div><strong>Name:</strong> {name || 'N/A'}</div>
          <div><strong>Email:</strong> {email || 'N/A'}</div>
          <div><strong>Role:</strong> {role || 'N/A'}</div>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-xl font-medium mb-2">Notification Preferences</h3>
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            id="emailAlerts"
            checked={emailAlerts}
            onChange={(e) => setEmailAlerts(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="emailAlerts">Email alerts</label>
        </div>
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            id="projectUpdates"
            checked={projectUpdates}
            onChange={(e) => setProjectUpdates(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="projectUpdates">Project updates</label>
        </div>
      </section>

      <button
        onClick={handleSave}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Save Preferences
      </button>
    </div>
  );
};

export default Settings;
