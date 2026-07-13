import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

let pool;

export function getDb() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      charset: 'utf8mb4',
    });
  }
  return pool;
}

export async function runMigrations() {
  const db = getDb();

  await db.execute(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'client',
    plan VARCHAR(20) DEFAULT 'free',
    max_profiles INT DEFAULT 1,
    plan_expires_at DATETIME NULL,
    subscription_status VARCHAR(20) DEFAULT 'active',
    referral_source VARCHAR(100) NULL,
    dice_client_id TEXT,
    dice_client_secret TEXT,
    dice_base_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await db.execute(`CREATE TABLE IF NOT EXISTS profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    bio TEXT,
    avatar TEXT,
    cover TEXT,
    stats_images INT DEFAULT 0,
    stats_videos INT DEFAULT 0,
    stats_likes VARCHAR(50),
    stats_posts INT DEFAULT 0,
    price_monthly DECIMAL(10,2) DEFAULT 0,
    price_quarterly DECIMAL(10,2) DEFAULT 0,
    price_semiannual DECIMAL(10,2) DEFAULT 0,
    discount_quarterly VARCHAR(50),
    discount_semiannual VARCHAR(50),
    verified TINYINT(1) DEFAULT 1,
    is_live TINYINT(1) DEFAULT 0,
    back_redirect_enabled TINYINT(1) DEFAULT 0,
    back_redirect_url TEXT,
    upsell_enabled TINYINT(1) DEFAULT 0,
    upsell_url TEXT,
    facebook_pixel VARCHAR(100),
    facebook_token TEXT,
    tiktok_pixel VARCHAR(100),
    google_analytics VARCHAR(100),
    dice_api_enabled TINYINT(1) DEFAULT 0,
    redirect_url_monthly TEXT,
    redirect_url_quarterly TEXT,
    redirect_url_semiannual TEXT,
    cloaker_enabled TINYINT(1) DEFAULT 0,
    total_views INT DEFAULT 0,
    conversions INT DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await db.execute(`CREATE TABLE IF NOT EXISTS profile_media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    profile_id INT NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(10) DEFAULT 'image',
    opacity FLOAT DEFAULT 0.5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await db.execute(`CREATE TABLE IF NOT EXISTS access_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    profile_id INT,
    slug VARCHAR(100),
    ip VARCHAR(50),
    user_agent TEXT,
    country VARCHAR(10) DEFAULT 'UNKNOWN',
    asn VARCHAR(100) DEFAULT 'UNKNOWN',
    device VARCHAR(50) DEFAULT 'Unknown',
    source VARCHAR(50) DEFAULT 'Direct',
    status VARCHAR(10) NOT NULL,
    reason VARCHAR(200) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await db.execute(`CREATE TABLE IF NOT EXISTS referrals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    registrations INT DEFAULT 0,
    sales INT DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0.00,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await db.execute(`CREATE TABLE IF NOT EXISTS system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  // Seed defaults
  const defaults = [
    ['plan_price_simples', '49.90'],
    ['plan_price_pro', '99.90'],
    ['plan_price_unlimited', '199.90'],
    ['saas_dice_client_id', ''],
    ['saas_dice_client_secret', ''],
    ['saas_dice_base_url', 'https://api.use-dice.com/api'],
    ['registration_open', '1'],
  ];
  for (const [k, v] of defaults) {
    await db.execute('INSERT IGNORE INTO system_config (config_key, config_value) VALUES (?, ?)', [k, v]);
  }

  console.log('✅ Migrations OK');
}
