import { Router } from 'express';
import { getDb } from '../db/migrate.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/referrals
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.execute('SELECT * FROM referrals ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/referrals
router.post('/', adminMiddleware, async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'Nome e código obrigatórios' });
    const db = getDb();
    await db.execute('INSERT INTO referrals (name, code) VALUES (?, ?)', [name, code.toUpperCase()]);
    res.status(201).json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Código já em uso' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/referrals/:id
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const db = getDb();
    await db.execute('DELETE FROM referrals WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
