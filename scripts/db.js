import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import pg from 'pg'
import { DATABASE_URL } from './neon-config.js'

export const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const rootDir = path.resolve(__dirname, '..')

dotenv.config({ path: path.join(rootDir, '.env.local') })
dotenv.config({ path: path.join(rootDir, '.env') })

export function databaseUrl() {
  const url = DATABASE_URL
  if (!url) {
    throw new Error('请先在 .env.local 里配置 DATABASE_URL=你的 Neon 连接字符串')
  }
  return url
}

export function createClient() {
  return new pg.Client({
    connectionString: databaseUrl(),
    ssl: { rejectUnauthorized: false },
  })
}

export function readJson(relativePath, fallback) {
  const fullPath = path.join(rootDir, relativePath)
  if (!fs.existsSync(fullPath)) return fallback
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'))
}
