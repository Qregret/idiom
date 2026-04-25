import fs from 'node:fs'
import path from 'node:path'
import { createClient, rootDir } from './db.js'

const schemaSql = fs.readFileSync(path.join(rootDir, 'db', 'schema.sql'), 'utf8')
const client = createClient()

try {
  await client.connect()
  await client.query(schemaSql)
  console.log('Neon 表结构已创建/更新')
} finally {
  await client.end()
}
