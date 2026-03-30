import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import eventsRouter from './routes/events.js';
import venuesRouter from './routes/venues.js';
import adminRouter from './routes/admin.js';
import { syncAllSources } from './services/sync.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Supabase client ──────────────────────────────────────────────────────────
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/events', eventsRouter);
app.use('/api/venues', venuesRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Cron: sync every 6 hours ──────────────────────────────────────────────────
cron.schedule('0 */6 * * *', async () => {
  console.log('Cron: starting scheduled sync...');
  try {
    await syncAllSources();
  } catch (err) {
    console.error('Cron sync error:', err);
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`OnTonight API running on port ${PORT}`);
});