# Add Redis caching layer for Clients and Projects API endpoints

Repository: BALASANJEEV/vimix

We need to improve backend API response times by caching frequently requested data using Redis.

Please implement Redis caching in vimix-crm-backend:
1. Create a Redis client configuration in vimix-crm-backend/config/redis.js that connects using process.env.REDIS_URL or falls back to 'redis://localhost:6379' with error handling so the server doesn't crash if Redis is offline.
2. In vimix-crm-backend/controllers/clientController.js and projectController.js:
   - Cache GET all clients ('clients:all') and GET all projects ('projects:all') with a 60-second TTL.
   - Automatically invalidate/flush the respective cache keys whenever a client or project is created, updated, or deleted.
