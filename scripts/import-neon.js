import fs from 'node:fs'
import path from 'node:path'
import { createClient, readJson, rootDir } from './db.js'

const idioms = readJson('src/data/idioms.json', [])
const progressPath = path.join(rootDir, 'data', 'progress.json')
const progress = fs.existsSync(progressPath)
  ? JSON.parse(fs.readFileSync(progressPath, 'utf8'))
  : { users: {} }

if (!idioms.length) {
  throw new Error('没有找到 src/data/idioms.json，请先运行 python .\\export_idioms.py')
}

const client = createClient()

try {
  await client.connect()
  await client.query('BEGIN')

  for (const [index, item] of idioms.entries()) {
    await client.query(
      `
      INSERT INTO idioms (
        word, order_index, explanation, frequency, exact_frequency, min_frequency,
        reliability_level, confidence, occurrence_count, source_site_count,
        priority_score, frequency_basis, source_urls, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13::jsonb, NOW()
      )
      ON CONFLICT (word) DO UPDATE SET
        order_index = EXCLUDED.order_index,
        explanation = EXCLUDED.explanation,
        frequency = EXCLUDED.frequency,
        exact_frequency = EXCLUDED.exact_frequency,
        min_frequency = EXCLUDED.min_frequency,
        reliability_level = EXCLUDED.reliability_level,
        confidence = EXCLUDED.confidence,
        occurrence_count = EXCLUDED.occurrence_count,
        source_site_count = EXCLUDED.source_site_count,
        priority_score = EXCLUDED.priority_score,
        frequency_basis = EXCLUDED.frequency_basis,
        source_urls = EXCLUDED.source_urls,
        updated_at = NOW()
      `,
      [
        item.word,
        item.id || index + 1,
        item.explanation || '',
        item.frequency || 0,
        item.exactFrequency ?? null,
        item.minFrequency || 0,
        item.reliabilityLevel || 'C',
        item.confidence || 0.5,
        item.occurrenceCount || 0,
        item.sourceSiteCount || 0,
        item.priorityScore || 0,
        item.frequencyBasis || '',
        JSON.stringify(item.sourceUrls || []),
      ],
    )
  }

  for (const [ip, user] of Object.entries(progress.users || {})) {
    await client.query(
      `
      INSERT INTO visitor_settings (ip, daily_target, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (ip) DO UPDATE SET
        daily_target = EXCLUDED.daily_target,
        updated_at = NOW()
      `,
      [ip, user.dailyTarget || 30],
    )

    const words = new Set([
      ...Object.keys(user.learned || {}),
      ...Object.keys(user.favorites || {}),
    ])

    for (const word of words) {
      const learned = user.learned?.[word]
      const favoritedAt = user.favorites?.[word] || null
      await client.query(
        `
        INSERT INTO visitor_word_progress (
          ip, word, remembered, learned_at, favorite, favorited_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (ip, word) DO UPDATE SET
          remembered = EXCLUDED.remembered,
          learned_at = EXCLUDED.learned_at,
          favorite = EXCLUDED.favorite,
          favorited_at = EXCLUDED.favorited_at,
          updated_at = NOW()
        `,
        [
          ip,
          word,
          learned ? Boolean(learned.remembered) : null,
          learned?.learnedAt || null,
          Boolean(favoritedAt),
          favoritedAt,
        ],
      )
    }
  }

  await client.query('COMMIT')
  console.log(`已导入 ${idioms.length} 条成语到 Neon`)
  console.log(`已导入 ${Object.keys(progress.users || {}).length} 个 IP 的本地学习记录`)
} catch (error) {
  await client.query('ROLLBACK')
  throw error
} finally {
  await client.end()
}
