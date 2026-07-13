import { Router } from 'express';
import { getDb } from '../db/migrate.js';
import { authMiddleware, planLimits } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /api/profiles — listar funis do usuário
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const query = req.user.role === 'admin'
      ? 'SELECT * FROM profiles ORDER BY created_at DESC'
      : 'SELECT * FROM profiles WHERE user_id = ? ORDER BY created_at DESC';
    const params = req.user.role === 'admin' ? [] : [req.user.id];
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/profiles/:id
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.execute('SELECT * FROM profiles WHERE id = ?', [req.params.id]);
    const profile = rows[0];
    if (!profile) return res.status(404).json({ error: 'Funil não encontrado' });
    if (req.user.role !== 'admin' && profile.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    // Buscar mídias
    const [media] = await db.execute('SELECT * FROM profile_media WHERE profile_id = ? ORDER BY created_at DESC', [profile.id]);
    res.json({ ...profile, media });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/profiles — criar novo funil
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    // Verificar limite do plano
    const [existing] = await db.execute('SELECT COUNT(*) as c FROM profiles WHERE user_id = ?', [req.user.id]);
    const limit = planLimits(req.user.plan);
    if (existing[0].c >= limit) {
      return res.status(403).json({ error: `Seu plano permite apenas ${limit} funil(s). Faça upgrade para criar mais.` });
    }

    const { name, username, slug, bio, avatar, cover, price_monthly, price_quarterly, price_semiannual } = req.body;
    if (!name || !slug) return res.status(400).json({ error: 'Nome e slug são obrigatórios' });

    const [result] = await db.execute(
      `INSERT INTO profiles (user_id, name, username, slug, bio, avatar, cover, price_monthly, price_quarterly, price_semiannual)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, name, username || name, slug.toLowerCase().replace(/[^a-z0-9-]/g, ''), bio || '', avatar || '', cover || '',
       price_monthly || 0, price_quarterly || 0, price_semiannual || 0]
    );
    const [newProfile] = await db.execute('SELECT * FROM profiles WHERE id = ?', [result.insertId]);
    res.status(201).json(newProfile[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Slug já em uso. Escolha outro.' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/profiles/:id — editar funil
router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.execute('SELECT * FROM profiles WHERE id = ?', [req.params.id]);
    const profile = rows[0];
    if (!profile) return res.status(404).json({ error: 'Funil não encontrado' });
    if (req.user.role !== 'admin' && profile.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const fields = [
      'name','username','slug','bio','avatar','cover',
      'stats_images','stats_videos','stats_likes','stats_posts',
      'price_monthly','price_quarterly','price_semiannual',
      'discount_quarterly','discount_semiannual',
      'verified','is_live','back_redirect_enabled','back_redirect_url',
      'upsell_enabled','upsell_url',
      'facebook_pixel','facebook_token','tiktok_pixel','google_analytics',
      'dice_api_enabled','redirect_url_monthly','redirect_url_quarterly','redirect_url_semiannual',
      'cloaker_enabled'
    ];

    const updates = [];
    const values = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        values.push(req.body[f]);
      }
    }
    if (!updates.length) return res.status(400).json({ error: 'Nada para atualizar' });
    values.push(req.params.id);

    await db.execute(`UPDATE profiles SET ${updates.join(', ')} WHERE id = ?`, values);
    const [updated] = await db.execute('SELECT * FROM profiles WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/profiles/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.execute('SELECT * FROM profiles WHERE id = ?', [req.params.id]);
    const profile = rows[0];
    if (!profile) return res.status(404).json({ error: 'Funil não encontrado' });
    if (req.user.role !== 'admin' && profile.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    await db.execute('DELETE FROM profile_media WHERE profile_id = ?', [req.params.id]);
    await db.execute('DELETE FROM profiles WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
