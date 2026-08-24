import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const client = createClient({ url: redisUrl });

client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// Attempt to connect; errors are logged but do not crash the app
client.connect().catch((err) => {
  console.error('Redis connection error:', err);
});

const get = async (key) => {
  try {
    return await client.get(key);
  } catch (e) {
    console.error('Redis GET error:', e);
    return null;
  }
};

const set = async (key, value, ttlSeconds) => {
  try {
    await client.setEx(key, ttlSeconds, value);
  } catch (e) {
    console.error('Redis SET error:', e);
  }
};

const del = async (key) => {
  try {
    await client.del(key);
  } catch (e) {
    console.error('Redis DEL error:', e);
  }
};

export default { get, set, del };