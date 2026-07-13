import { Router } from 'express';
import { getDb } from '../db/migrate.js';

const router = Router();

// GET /api/public/:slug — dados públicos do perfil (usado pela página pública)
router.get('/:slug', async (req, res) => {
  try {
    const db = getDb();
    const [rows] = await db.execute(
      `SELECT id, slug, name, username, bio, avatar, cover,
              stats_images, stats_videos, stats_likes, stats_posts,
              price_monthly, price_quarterly, price_semiannual,
              discount_quarterly, discount_semiannual,
              verified, is_live, facebook_pixel, tiktok_pixel, google_analytics,
              upsell_enabled, upsell_url, back_redirect_enabled, back_redirect_url,
              cloaker_enabled
       FROM profiles WHERE slug = ? AND is_live = 1`,
      [req.params.slug]
    );
    const profile = rows[0];
    if (!profile) return res.status(404).json({ error: 'Perfil não encontrado ou offline' });

    // Buscar mídias
    const [media] = await db.execute(
      'SELECT id, file_path, file_type, opacity FROM profile_media WHERE profile_id = ? ORDER BY created_at DESC',
      [profile.id]
    );

    res.json({ ...profile, media });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
