import express from 'express';
import { supabase } from '../index.js';
import { adminAuthMiddleware } from '../middleware/auth.js';
import { strictLimiter } from '../middleware/rateLimit.js';
import { syncAllSources } from '../services/sync.js';

const router = express.Router();
router.use(strictLimiter);
router.use(adminAuthMiddleware);

/**
 * GET /api/admin/pending
 * Returns all events pending moderation (is_verified = false)
 */
router.get('/pending', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*, venues(*)')
      .eq('is_verified', false)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json({ pending: data || [] });
  } catch (err) {
    console.error('GET /api/admin/pending error:', err);
    res.status(500).json({ error: 'Failed to fetch pending events.' });
  }
});

/**
 * POST /api/admin/approve/:id
 */
router.post('/approve/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .update({ is_verified: true })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, event: data });
  } catch (err) {
    console.error('POST /api/admin/approve error:', err);
    res.status(500).json({ error: 'Failed to approve event.' });
  }
});

/**
 * DELETE /api/admin/reject/:id
 */
router.delete('/reject/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/reject error:', err);
    res.status(500).json({ error: 'Failed to reject event.' });
  }
});

/**
 * POST /api/admin/sync
 * Manual trigger for event sync
 */
router.post('/sync', async (req, res) => {
  try {
    console.log('Manual sync triggered via API');
    const results = await syncAllSources();
    res.json({ success: true, results });
  } catch (err) {
    console.error('POST /api/admin/sync error:', err);
    res.status(500).json({ error: 'Sync failed.', details: err.message });
  }
});

export default router;
