import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db/migrate.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios' });

    const db = getDb();
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name, plan: user.plan });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const db = getDb();

    // Verificar se registro está aberto
    const [cfg] = await db.execute("SELECT config_value FROM system_config WHERE config_key = 'registration_open'");
    if (cfg[0]?.config_value !== '1') {
      return res.status(403).json({ error: 'Registros temporariamente fechados' });
    }

    const { name, email, password, referral_code } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Campos obrigatórios' });

    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing[0]) return res.status(409).json({ error: 'Email já cadastrado' });

    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password, role, plan, max_profiles, referral_source) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name || 'Usuário', email, hash, 'client', 'free', 1, referral_code || null]
    );

    // Incrementar referral se houver código
    if (referral_code) {
      await db.execute('UPDATE referrals SET registrations = registrations + 1 WHERE code = ?', [referral_code]);
    }

    const token = signToken({ id: result.insertId, email, role: 'client', name: name || 'Usuário', plan: 'free' });
    res.status(201).json({ token, user: { id: result.insertId, name, email, role: 'client', plan: 'free' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Não autorizado' });
  try {
    const jwt = await import('jsonwebtoken');
    const user = jwt.default.verify(header.slice(7), process.env.JWT_SECRET || 'nuve-secret-key-change-in-prod');
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
});

export default router;
