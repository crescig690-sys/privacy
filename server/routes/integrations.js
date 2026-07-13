import { Router } from 'express';
import { getDb } from '../db/migrate.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /api/integrations — credenciais Dice do usuário
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.execute(
      'SELECT dice_client_id, dice_client_secret, dice_base_url FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/integrations
router.put('/', async (req, res) => {
  try {
    const { dice_client_id, dice_client_secret, dice_base_url } = req.body;
    const db = getDb();
    await db.execute(
      'UPDATE users SET dice_client_id = ?, dice_client_secret = ?, dice_base_url = ? WHERE id = ?',
      [dice_client_id || '', dice_client_secret || '', dice_base_url || 'https://dev.use-dice.com', req.user.id]
    );
    res.json({ success: true, message: 'Integrações sincronizadas!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
