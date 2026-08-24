# Add Settings page to CRM frontend

Repository: BALASANJEEV/vimix

Please add a Settings page to the CRM:
1. Create a new component in vimix-crm-frontend/src/components/Settings.tsx with:
   - A profile overview section (showing current user's name, email, and role from localStorage).
   - Basic notification preference checkboxes (Email alerts, Project updates).
   - A clean "Save Preferences" button.
2. In vimix-crm-frontend/src/App.tsx, register the route `/settings` pointing to `<Settings />`.
