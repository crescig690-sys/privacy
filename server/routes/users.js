import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/migrate.js';
import { adminMiddleware, planLimits } from '../middleware/auth.js';

const router = Router();
router.use(adminMiddleware);

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.execute(
      'SELECT id, name, email, role, plan, max_profiles, subscription_status, plan_expires_at, referral_source, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id — editar plano/role
router.put('/:id', async (req, res) => {
  try {
    const { name, role, plan, subscription_status, plan_expires_at } = req.body;
    const max_profiles = planLimits(plan);
    const db = getDb();
    await db.execute(
      'UPDATE users SET name=?, role=?, plan=?, max_profiles=?, subscription_status=?, plan_expires_at=? WHERE id=?',
      [name, role, plan, max_profiles, subscription_status, plan_expires_at || null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:id/reset-password
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Senha obrigatória' });
    const hash = await bcrypt.hash(password, 12);
    const db = getDb();
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hash, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
