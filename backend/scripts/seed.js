require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function seed() {
  const client = await pool.connect();
  try {
    const hash = await bcrypt.hash('admin123456', 12);

    // Create admin user
    await client.query(
      `INSERT INTO users (email, password_hash, full_name, company, role, tier)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING`,
      ['admin@permitpro.ai', hash, 'Admin User', 'PermitPro', 'admin', 'enterprise']
    );

    // Create demo user
    const demoHash = await bcrypt.hash('demo123456', 12);
    await client.query(
      `INSERT INTO users (email, password_hash, full_name, company, role, tier)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING`,
      ['demo@permitpro.ai', demoHash, 'Demo Architect', 'Demo Architecture Firm', 'user', 'pro']
    );

    console.log('Seed complete.');
    console.log('Admin: admin@permitpro.ai / admin123456');
    console.log('Demo:  demo@permitpro.ai / demo123456');
  } catch (err) {
    console.error('Seed failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
