# Fix 'Invalid token' error on Clients, Partners, and Projects pages

Repository: BALASANJEEV/vimix
When navigating to the Clients, Partners, or Projects tabs in the frontend CRM, an error banner appears stating:
"Error loading partners: Invalid token" (HTTP 401).

Please fix the authentication token handling and ensure:
1. The frontend API client attaches the Bearer token properly in the Authorization header for all client, partner, and project requests.
2. In vimix-crm-backend/middleware/verifyPartner.js, ensure JWT verification handles missing or fallback secrets cleanly and verifies the user's role without throwing 401 on valid active sessions.
