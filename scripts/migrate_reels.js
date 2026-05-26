const { Pool } = require('pg');
const fs = require('fs');

async function run() {
  let host = process.env.DB_HOST || 'localhost';
  let port = parseInt(process.env.DB_PORT || '5432', 10);
  let database = process.env.DB_NAME || 'postgres';
  let user = process.env.DB_USER || 'postgres';
  let password = process.env.DB_PASSWORD || '';

  // Attempt to load from OS backend .env file
  const osEnvPath = '/var/www/mistyvisuals-os/backend/.env';
  if (fs.existsSync(osEnvPath)) {
    const envContent = fs.readFileSync(osEnvPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex === -1) continue;
      
      const key = trimmed.substring(0, equalIndex).trim();
      let val = trimmed.substring(equalIndex + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }

      if (key === 'DB_HOST') host = val;
      if (key === 'DB_PORT') port = parseInt(val, 10) || 5432;
      if (key === 'DB_NAME') database = val;
      if (key === 'DB_USER') user = val;
      if (key === 'DB_PASSWORD') password = val;
    }
  }

  const pool = new Pool({ host, port, database, user, password });

  try {
    console.log('Running migration: creating website_reels table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS website_reels (
        id SERIAL PRIMARY KEY,
        story_id INTEGER REFERENCES website_stories(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        youtube_video_id VARCHAR(50) NOT NULL,
        thumbnail_url VARCHAR(255),
        thumbnail_blur TEXT,
        display_order INTEGER DEFAULT 0,
        is_published BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Successfully completed reels migration!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

run();
