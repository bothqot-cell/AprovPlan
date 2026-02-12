require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function run() {
  const direction = process.argv[2];
  const client = await pool.connect();

  try {
    if (direction === 'down') {
      console.log('Rolling back schema...');
      await client.query(`
        DROP TABLE IF EXISTS audit_log CASCADE;
        DROP TABLE IF EXISTS analyses CASCADE;
        DROP TABLE IF EXISTS uploads CASCADE;
        DROP TABLE IF EXISTS projects CASCADE;
        DROP TABLE IF EXISTS feature_flags CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
        DROP FUNCTION IF EXISTS update_updated_at CASCADE;
      `);
      console.log('Rollback complete.');
    } else {
      console.log('Running migrations...');
      const sql = fs.readFileSync(
        path.join(__dirname, '001_initial_schema.sql'),
        'utf-8'
      );
      await client.query(sql);
      console.log('Migrations complete.');
    }
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
