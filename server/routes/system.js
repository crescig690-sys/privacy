import { Router } from 'express';
import { getDb } from '../db/migrate.js';
import { adminMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(adminMiddleware);

// GET /api/system
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.execute('SELECT config_key, config_value FROM system_config');
    const config = {};
    for (const r of rows) config[r.config_key] = r.config_value;
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/system
router.put('/', async (req, res) => {
  try {
    const db = getDb();
    for (const [key, value] of Object.entries(req.body)) {
      await db.execute(
        'INSERT INTO system_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?',
        [key, value, value]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/system/stats — dashboard stats globais
router.get('/stats', async (req, res) => {
  try {
    const db = getDb();
    const [[views]] = await db.execute('SELECT COALESCE(SUM(total_views),0) as v FROM profiles');
    const [[convs]] = await db.execute('SELECT COALESCE(SUM(conversions),0) as c FROM profiles');
    const [[revenue]] = await db.execute('SELECT COALESCE(SUM(total_revenue),0) as r FROM profiles');
    const [[blocked]] = await db.execute("SELECT COUNT(*) as b FROM access_logs WHERE status = 'BLOCKED'");
    const [[totalUsers]] = await db.execute('SELECT COUNT(*) as u FROM users');
    const [[totalProfiles]] = await db.execute('SELECT COUNT(*) as p FROM profiles');
    res.json({
      total_views: views.v,
      total_conversions: convs.c,
      total_revenue: revenue.r,
      total_blocked: blocked.b,
      total_users: totalUsers.u,
      total_profiles: totalProfiles.p,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
