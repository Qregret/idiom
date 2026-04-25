import { createClient } from './db.js'

const client = createClient()

try {
  await client.connect()
  const idioms = await client.query('SELECT COUNT(*)::int AS total FROM idioms')
  const progress = await client.query(
    'SELECT COUNT(DISTINCT ip)::int AS users, COUNT(*)::int AS records FROM visitor_word_progress',
  )
  const top = await client.query(
    `
    SELECT word, reliability_level, frequency, exact_frequency
    FROM idioms
    ORDER BY reliability_level ASC, priority_score DESC
    LIMIT 10
    `,
  )

  console.log('idioms:', idioms.rows[0].total)
  console.log('progress users:', progress.rows[0].users)
  console.log('progress records:', progress.rows[0].records)
  console.table(top.rows)
} finally {
  await client.end()
}
