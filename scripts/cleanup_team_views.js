const fs = require('fs');
const crypto = require('crypto');
const { Pool } = require('pg');

// 1. Database Connection Initialization
let host = process.env.DB_HOST;
let port = parseInt(process.env.DB_PORT || '5432', 10);
let database = process.env.DB_NAME;
let user = process.env.DB_USER;
let password = process.env.DB_PASSWORD;

const osEnvPath = '/var/www/mistyvisuals-os/backend/.env';
if (fs.existsSync(osEnvPath)) {
  try {
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
  } catch (err) {
    console.error('Failed to read OS backend .env file:', err);
  }
}

const pool = new Pool({
  host: host || 'localhost',
  port: port || 5432,
  database: database || 'postgres',
  user: user || 'postgres',
  password: password || '',
  connectionTimeoutMillis: 4000,
});

async function main() {
  console.log('Starting team analytics views cleanup utility...');

  try {
    // 2. Fetch all team IPs
    const ipsResult = await pool.query('SELECT DISTINCT ip FROM known_internal_ips');
    const dbIps = ipsResult.rows.map(r => r.ip).filter(Boolean);
    
    // Always include local loopback IPs for local test purging, and deduplicate
    const teamIps = new Set([...dbIps, '127.0.0.1', '::1', '::ffff:127.0.0.1']);
    console.log(`Targeting ${teamIps.size} team & loopback IP address(es):`, Array.from(teamIps));

    // 3. Fetch all distinct user agents from user sessions
    const uaResult = await pool.query('SELECT DISTINCT user_agent FROM user_sessions');
    const userAgents = new Set(uaResult.rows.map(r => r.user_agent).filter(Boolean));
    
    // Add fallback and standard developer user agents
    userAgents.add('');
    userAgents.add('curl/8.7.1');
    console.log(`Found ${userAgents.size} distinct user agent strings in database.`);

    // 4. Fetch all created_at timestamps from website_analytics_views
    const timestampsResult = await pool.query('SELECT created_at FROM website_analytics_views');
    
    // Convert timestamps to UTC YYYY-MM-DD format in JavaScript to avoid database/server timezone mismatches
    const dateStrings = new Set();
    for (const row of timestampsResult.rows) {
      if (row.created_at) {
        const utcDateStr = new Date(row.created_at).toISOString().slice(0, 10);
        dateStrings.add(utcDateStr);
      }
    }
    const dates = Array.from(dateStrings);
    console.log(`Found ${dates.length} UTC date(s) with active analytics views:`, dates);

    if (dates.length === 0) {
      console.log('No records in website_analytics_views. Nothing to clean up.');
      return;
    }

    // 5. Generate possible hashes for combinations of team IPs, User Agents, and UTC dates
    const targetHashes = new Set();
    for (const ip of teamIps) {
      for (const ua of userAgents) {
        for (const date of dates) {
          const hashInput = `${ip}-${ua}-${date}`;
          const sessionHash = crypto.createHash('sha256').update(hashInput).digest('hex');
          targetHashes.add(sessionHash);
        }
      }
    }

    const hashList = Array.from(targetHashes);
    console.log(`Reconstructed ${hashList.length} potential session hashes for the team.`);

    // 6. Delete views and events matching target hashes
    if (hashList.length > 0) {
      const viewsBefore = await pool.query('SELECT COUNT(*) FROM website_analytics_views');
      
      const deleteViews = await pool.query(
        'DELETE FROM website_analytics_views WHERE session_hash = ANY($1)',
        [hashList]
      );
      console.log(`Successfully deleted ${deleteViews.rowCount} rows from website_analytics_views.`);

      const deleteEvents = await pool.query(
        'DELETE FROM website_analytics_events WHERE session_hash = ANY($1)',
        [hashList]
      );
      console.log(`Successfully deleted ${deleteEvents.rowCount} rows from website_analytics_events.`);

      const viewsAfter = await pool.query('SELECT COUNT(*) FROM website_analytics_views');
      console.log(`Analytics views count went from ${viewsBefore.rows[0].count} to ${viewsAfter.rows[0].count}.`);
    }

  } catch (err) {
    console.error('Error executing cleanup utility:', err);
  } finally {
    await pool.end();
    console.log('Cleanup utility completed.');
  }
}

main();
