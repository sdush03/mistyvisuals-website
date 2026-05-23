import { Pool } from 'pg'
import fs from 'fs'

let pool: Pool | null = null

export function getDbPool(): Pool {
  if (pool) return pool

  let host = process.env.DB_HOST
  let port = parseInt(process.env.DB_PORT || '5432', 10)
  let database = process.env.DB_NAME
  let user = process.env.DB_USER
  let password = process.env.DB_PASSWORD

  // Attempt to load from OS backend .env file in production if not explicitly defined in Next.js env
  if (!host || !database || !user) {
    const osEnvPath = '/var/www/mistyvisuals-os/backend/.env'
    if (fs.existsSync(osEnvPath)) {
      try {
        const envContent = fs.readFileSync(osEnvPath, 'utf8')
        const lines = envContent.split('\n')
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith('#')) continue
          const equalIndex = trimmed.indexOf('=')
          if (equalIndex === -1) continue
          
          const key = trimmed.substring(0, equalIndex).trim()
          // Extract value and clean potential surrounding quotes
          let val = trimmed.substring(equalIndex + 1).trim()
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1)
          }

          if (key === 'DB_HOST') host = val
          if (key === 'DB_PORT') port = parseInt(val, 10) || 5432
          if (key === 'DB_NAME') database = val
          if (key === 'DB_USER') user = val
          if (key === 'DB_PASSWORD') password = val
        }
      } catch (err) {
        console.error('Failed to dynamically read OS backend .env file:', err)
      }
    }
  }

  pool = new Pool({
    host: host || 'localhost',
    port: port || 5432,
    database: database || 'postgres',
    user: user || 'postgres',
    password: password || '',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 4000,
  })

  // Prevent pool from crashing the Node.js process on idle connection errors
  pool.on('error', (err) => {
    console.error('Unexpected database client error in connection pool:', err)
  })

  return pool
}

export async function query(text: string, params?: any[]) {
  const activePool = getDbPool()
  return activePool.query(text, params)
}
