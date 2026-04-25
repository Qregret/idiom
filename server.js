import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { DATABASE_URL } from './scripts/neon-config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 5174)
const WORDS_PATH = path.join(__dirname, 'src', 'data', 'idioms.json')
const STORE_PATH = path.join(__dirname, 'data', 'progress.json')
const DIST_PATH = path.join(__dirname, 'dist')

const app = express()
app.use(express.json({ limit: '1mb' }))

const localWords = JSON.parse(fs.readFileSync(WORDS_PATH, 'utf8')).map((word, index) => ({
  ...word,
  order: index + 1,
}))

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

function ensureStore() {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true })
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify({ users: {} }, null, 2), 'utf8')
  }
}

function readStore() {
  ensureStore()
  return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'))
}

function writeStore(store) {
  ensureStore()
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8')
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  const raw = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(',')[0] || req.socket.remoteAddress || 'unknown'
  return raw.replace(/^::ffff:/, '').replace(/^::1$/, '127.0.0.1')
}

function normalizeDbWord(row) {
  return {
    id: row.order_index,
    order: row.order_index,
    word: row.word,
    explanation: row.explanation || '',
    frequency: row.frequency || 0,
    exactFrequency: row.exact_frequency,
    minFrequency: row.min_frequency || 0,
    reliabilityLevel: row.reliability_level || 'C',
    confidence: Number(row.confidence || 0),
    occurrenceCount: row.occurrence_count || 0,
    sourceSiteCount: row.source_site_count || 0,
    priorityScore: Number(row.priority_score || 0),
    frequencyBasis: row.frequency_basis || '',
    sourceUrls: row.source_urls || [],
    learned: Boolean(row.learned_at),
    remembered: row.remembered,
    learnedAt: row.learned_at,
    favorite: Boolean(row.favorite),
  }
}

async function withDb(callback) {
  const client = await pool.connect()
  try {
    return await callback(client)
  } finally {
    client.release()
  }
}

async function ensureVisitor(client, ip) {
  await client.query(
    `
    INSERT INTO visitor_settings (ip, daily_target, updated_at)
    VALUES ($1, 30, NOW())
    ON CONFLICT (ip) DO NOTHING
    `,
    [ip],
  )
}

async function dbStats(client, ip) {
  const result = await client.query(
    `
    SELECT
      (SELECT COUNT(*)::int FROM idioms) AS total_words,
      COUNT(p.word)::int AS learned_count,
      COUNT(*) FILTER (WHERE p.learned_at IS NOT NULL AND p.remembered = true)::int AS remembered_count,
      COUNT(*) FILTER (WHERE p.learned_at IS NOT NULL AND p.remembered = false)::int AS forgotten_count,
      COUNT(*) FILTER (WHERE p.favorite = true)::int AS favorite_count
    FROM visitor_word_progress p
    WHERE p.ip = $1 AND (p.learned_at IS NOT NULL OR p.favorite = true)
    `,
    [ip],
  )
  const row = result.rows[0]
  return {
    totalWords: row.total_words,
    learnedCount: row.learned_count,
    rememberedCount: row.remembered_count,
    forgottenCount: row.forgotten_count,
    favoriteCount: row.favorite_count,
    remainingCount: Math.max(0, row.total_words - row.learned_count),
  }
}

async function dbWords(client, ip, type = 'all', query = '', limit = 200) {
  const keyword = query.trim()
  const filters = []
  const params = [ip]

  if (type === 'learned') {
    filters.push('p.learned_at IS NOT NULL')
  }
  if (type === 'remaining') {
    filters.push('p.learned_at IS NULL')
  }
  if (keyword) {
    params.push(`%${keyword}%`)
    filters.push(`(i.word ILIKE $${params.length} OR i.explanation ILIKE $${params.length})`)
  }
  params.push(limit)

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : ''
  const result = await client.query(
    `
    SELECT
      i.*,
      p.remembered,
      p.learned_at,
      COALESCE(p.favorite, false) AS favorite
    FROM idioms i
    LEFT JOIN visitor_word_progress p ON p.word = i.word AND p.ip = $1
    ${where}
    ORDER BY
      i.reliability_level ASC,
      i.priority_score DESC,
      i.frequency DESC,
      i.order_index ASC
    LIMIT $${params.length}
    `,
    params,
  )
  return result.rows.map(normalizeDbWord)
}

function localUserFor(req, store) {
  const ip = clientIp(req)
  if (!store.users[ip]) {
    store.users[ip] = {
      dailyTarget: 30,
      learned: {},
      favorites: {},
      createdAt: new Date().toISOString(),
    }
  }
  return { ip, user: store.users[ip] }
}

function localPublicWord(word, user) {
  const learned = user.learned[word.word]
  return {
    ...word,
    learned: Boolean(learned),
    remembered: learned?.remembered ?? null,
    learnedAt: learned?.learnedAt || null,
    favorite: Boolean(user.favorites[word.word]),
  }
}

function localStats(user) {
  const learnedWords = Object.values(user.learned)
  return {
    totalWords: localWords.length,
    learnedCount: learnedWords.length,
    rememberedCount: learnedWords.filter((item) => item.remembered).length,
    forgottenCount: learnedWords.filter((item) => !item.remembered).length,
    favoriteCount: Object.keys(user.favorites).length,
    remainingCount: Math.max(0, localWords.length - learnedWords.length),
  }
}

function localFilteredWords(user, type = 'all', query = '') {
  const keyword = query.trim().toLowerCase()
  return localWords
    .filter((word) => {
      if (type === 'learned' && !user.learned[word.word]) return false
      if (type === 'remaining' && user.learned[word.word]) return false
      if (!keyword) return true
      return (
        word.word.toLowerCase().includes(keyword) ||
        (word.explanation || '').toLowerCase().includes(keyword)
      )
    })
    .map((word) => localPublicWord(word, user))
}

async function routeWithFallback(req, res, dbHandler, localHandler) {
  try {
    const ip = clientIp(req)
    const data = await withDb(async (client) => {
      await ensureVisitor(client, ip)
      return dbHandler(client, ip)
    })
    res.json({ ...data, storage: 'neon' })
  } catch (error) {
    console.error('[Neon fallback]', error.message)
    localHandler()
  }
}

app.get('/api/me', (req, res) => {
  routeWithFallback(
    req,
    res,
    async (client, ip) => {
      const settings = await client.query('SELECT daily_target FROM visitor_settings WHERE ip = $1', [ip])
      return {
        ip,
        dailyTarget: settings.rows[0]?.daily_target || 30,
        stats: await dbStats(client, ip),
      }
    },
    () => {
      const store = readStore()
      const { ip, user } = localUserFor(req, store)
      writeStore(store)
      res.json({ ip, dailyTarget: user.dailyTarget, stats: localStats(user), storage: 'local' })
    },
  )
})

app.put('/api/settings', (req, res) => {
  const dailyTarget = Math.min(100, Math.max(5, Number(req.body.dailyTarget) || 30))
  routeWithFallback(
    req,
    res,
    async (client, ip) => {
      await client.query(
        `
        INSERT INTO visitor_settings (ip, daily_target, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (ip) DO UPDATE SET daily_target = EXCLUDED.daily_target, updated_at = NOW()
        `,
        [ip, dailyTarget],
      )
      return { ip, dailyTarget, stats: await dbStats(client, ip) }
    },
    () => {
      const store = readStore()
      const { ip, user } = localUserFor(req, store)
      user.dailyTarget = dailyTarget
      writeStore(store)
      res.json({ ip, dailyTarget, stats: localStats(user), storage: 'local' })
    },
  )
})

app.get('/api/session', (req, res) => {
  routeWithFallback(
    req,
    res,
    async (client, ip) => {
      const settings = await client.query('SELECT daily_target FROM visitor_settings WHERE ip = $1', [ip])
      const dailyTarget = settings.rows[0]?.daily_target || 30
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || dailyTarget))
      return {
        words: await dbWords(client, ip, 'remaining', '', limit),
        stats: await dbStats(client, ip),
        dailyTarget,
      }
    },
    () => {
      const store = readStore()
      const { user } = localUserFor(req, store)
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || user.dailyTarget || 30))
      const sessionWords = localWords
        .filter((word) => !user.learned[word.word])
        .slice(0, limit)
        .map((word) => localPublicWord(word, user))
      writeStore(store)
      res.json({ words: sessionWords, stats: localStats(user), dailyTarget: user.dailyTarget, storage: 'local' })
    },
  )
})

app.post('/api/answer', (req, res) => {
  const word = String(req.body.word || '')
  const remembered = Boolean(req.body.remembered)
  routeWithFallback(
    req,
    res,
    async (client, ip) => {
      const exists = await client.query('SELECT 1 FROM idioms WHERE word = $1', [word])
      if (!exists.rowCount) {
        res.status(400)
        return { error: 'unknown_word' }
      }
      await client.query(
        `
        INSERT INTO visitor_word_progress (ip, word, remembered, learned_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (ip, word) DO UPDATE SET
          remembered = EXCLUDED.remembered,
          learned_at = NOW(),
          updated_at = NOW()
        `,
        [ip, word, remembered],
      )
      return { word, remembered, stats: await dbStats(client, ip) }
    },
    () => {
      if (!localWords.some((item) => item.word === word)) {
        res.status(400).json({ error: 'unknown_word' })
        return
      }
      const store = readStore()
      const { user } = localUserFor(req, store)
      user.learned[word] = { remembered, learnedAt: new Date().toISOString() }
      writeStore(store)
      res.json({ word, remembered, stats: localStats(user), storage: 'local' })
    },
  )
})

app.post('/api/favorite', (req, res) => {
  const word = String(req.body.word || '')
  routeWithFallback(
    req,
    res,
    async (client, ip) => {
      const current = await client.query(
        'SELECT favorite FROM visitor_word_progress WHERE ip = $1 AND word = $2',
        [ip, word],
      )
      const nextFavorite = !current.rows[0]?.favorite
      await client.query(
        `
        INSERT INTO visitor_word_progress (ip, word, favorite, favorited_at, updated_at)
        VALUES ($1, $2, $3, CASE WHEN $3 THEN NOW() ELSE NULL END, NOW())
        ON CONFLICT (ip, word) DO UPDATE SET
          favorite = EXCLUDED.favorite,
          favorited_at = EXCLUDED.favorited_at,
          updated_at = NOW()
        `,
        [ip, word, nextFavorite],
      )
      return { word, favorite: nextFavorite, stats: await dbStats(client, ip) }
    },
    () => {
      if (!localWords.some((item) => item.word === word)) {
        res.status(400).json({ error: 'unknown_word' })
        return
      }
      const store = readStore()
      const { user } = localUserFor(req, store)
      if (user.favorites[word]) delete user.favorites[word]
      else user.favorites[word] = new Date().toISOString()
      writeStore(store)
      res.json({ word, favorite: Boolean(user.favorites[word]), stats: localStats(user), storage: 'local' })
    },
  )
})

app.get('/api/words', (req, res) => {
  routeWithFallback(
    req,
    res,
    async (client, ip) => {
      const type = String(req.query.type || 'all')
      const query = String(req.query.query || '')
      const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 200))
      return { words: await dbWords(client, ip, type, query, limit), stats: await dbStats(client, ip) }
    },
    () => {
      const store = readStore()
      const { user } = localUserFor(req, store)
      const type = String(req.query.type || 'all')
      const query = String(req.query.query || '')
      const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 200))
      const result = localFilteredWords(user, type, query).slice(0, limit)
      writeStore(store)
      res.json({ words: result, stats: localStats(user), storage: 'local' })
    },
  )
})

app.get('/api/word/:word', (req, res) => {
  routeWithFallback(
    req,
    res,
    async (client, ip) => {
      const rows = await dbWords(client, ip, 'all', req.params.word, 1)
      if (!rows.length || rows[0].word !== req.params.word) {
        res.status(404)
        return { error: 'not_found' }
      }
      return { word: rows[0] }
    },
    () => {
      const store = readStore()
      const { user } = localUserFor(req, store)
      const found = localWords.find((item) => item.word === req.params.word)
      if (!found) {
        res.status(404).json({ error: 'not_found' })
        return
      }
      writeStore(store)
      res.json({ word: localPublicWord(found, user), storage: 'local' })
    },
  )
})

if (fs.existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH))
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_PATH, 'index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Idiom study server running at http://0.0.0.0:${PORT}`)
})
