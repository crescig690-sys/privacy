import { Router } from 'express';
import { getDb } from '../db/migrate.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/logs — logs de acesso (auth obrigatório)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '50');
    const offset = (page - 1) * limit;

    let query, params;
    if (req.user.role === 'admin') {
      query = 'SELECT * FROM access_logs ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params = [limit, offset];
    } else {
      // Apenas logs dos perfis do usuário
      const [pids] = await db.execute('SELECT id FROM profiles WHERE user_id = ?', [req.user.id]);
      if (!pids.length) return res.json({ logs: [], total: 0 });
      const ids = pids.map(p => p.id);
      const placeholders = ids.map(() => '?').join(',');
      query = `SELECT * FROM access_logs WHERE profile_id IN (${placeholders}) ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      params = [...ids, limit, offset];
    }

    const [logs] = await db.execute(query, params);
    res.json({ logs, page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/logs — registrar acesso (público, chamado pelo cloaker)
router.post('/', async (req, res) => {
  try {
    const { profile_id, slug, ip, user_agent, country, asn, device, source, status, reason } = req.body;
    const db = getDb();
    await db.execute(
      'INSERT INTO access_logs (profile_id, slug, ip, user_agent, country, asn, device, source, status, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [profile_id, slug, ip, user_agent, country || 'UNKNOWN', asn || 'UNKNOWN', device || 'Unknown', source || 'Direct', status, reason || '']
    );
    // Incrementar views se status ALLOWED
    if (status === 'ALLOWED') {
      await db.execute('UPDATE profiles SET total_views = total_views + 1 WHERE id = ?', [profile_id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/logs — limpar logs (admin)
router.delete('/', adminMiddleware, async (req, res) => {
  try {
    const db = getDb();
    await db.execute('DELETE FROM access_logs');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
