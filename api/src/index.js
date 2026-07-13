import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

import authRouter from './routes/auth.js';
import profilesRouter from './routes/profiles.js';
import integrationsRouter from './routes/integrations.js';
import logsRouter from './routes/logs.js';
import usersRouter from './routes/users.js';
import systemRouter from './routes/system.js';
import referralsRouter from './routes/referrals.js';
import publicRouter from './routes/public.js';
import { runMigrations } from './db/migrate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.WEB_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/users', usersRouter);
app.use('/api/system', systemRouter);
app.use('/api/referrals', referralsRouter);
app.use('/api/public', publicRouter);

app.get('/api/health', (_, res) => res.json({ status: 'ok', version: '2.0.0' }));

// Apenas escuta a porta localmente se NÃO estiver no Vercel (onde process.env.VERCEL é definido)
if (!process.env.VERCEL) {
  runMigrations().then(() => {
    app.listen(PORT, () => console.log(`🛡️ nuve. API rodando em http://localhost:${PORT}`));
  }).catch(err => {
    console.error('Falha na migração:', err);
    process.exit(1);
  });
}

// Exportar app para o Vercel Serverless Functions
export default app;
