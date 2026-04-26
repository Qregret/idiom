import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

async function startServer() {
  const app = express();
  const PORT = 3000;

  const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_AwN3EyK0fZOl@ep-lively-feather-antrl9ag-pooler.c-6.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";
  if (!connectionString) {
    console.warn("WARNING: DATABASE_URL is not set. Database operations will fail.");
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  app.use(express.json());

  // Helper to get client IP
  const getIp = (req: express.Request) => {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = typeof forwarded === "string" ? forwarded.split(",")[0] : req.socket.remoteAddress;
    return ip || "127.0.0.1";
  };

  // API Routes
  app.get("/api/me", async (req, res) => {
    const ip = getIp(req);
    try {
      // Get settings
      let settingsResult = await pool.query("SELECT * FROM visitor_settings WHERE ip = $1", [ip]);
      if (settingsResult.rows.length === 0) {
        await pool.query("INSERT INTO visitor_settings (ip, daily_target) VALUES ($1, 30)", [ip]);
        settingsResult = await pool.query("SELECT * FROM visitor_settings WHERE ip = $1", [ip]);
      }
      const settings = settingsResult.rows[0];

      // Get stats
      const statsResult = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM idioms WHERE char_length(word) >= 4 AND word !~ '[A-Za-z0-9@]') as total_words,
          (SELECT COUNT(*) FROM idioms WHERE char_length(word) >= 4 AND word !~ '[A-Za-z0-9@]' AND frequency >= 6) as core_words,
          (SELECT COUNT(*) FROM idioms WHERE char_length(word) >= 4 AND word !~ '[A-Za-z0-9@]' AND frequency < 6) as low_freq_words,
          (SELECT COUNT(*) FROM visitor_word_progress WHERE ip = $1 AND remembered = true) as learned_count,
          (SELECT COUNT(*) FROM visitor_word_progress v JOIN idioms i ON v.word = i.word WHERE v.ip = $1 AND v.remembered = true AND i.frequency >= 6 AND char_length(i.word) >= 4 AND i.word !~ '[A-Za-z0-9@]') as core_learned,
          (SELECT COUNT(*) FROM visitor_word_progress v JOIN idioms i ON v.word = i.word WHERE v.ip = $1 AND v.remembered = true AND i.frequency < 6 AND char_length(i.word) >= 4 AND i.word !~ '[A-Za-z0-9@]') as low_freq_learned,
          (SELECT COUNT(*) FROM visitor_word_progress WHERE ip = $1 AND remembered = false) as forgotten_count,
          (SELECT COUNT(*) FROM visitor_word_progress WHERE ip = $1 AND favorite = true) as favorite_count
      `, [ip]);
      
      const stats = statsResult.rows[0];

      // Get activity (last 28 days)
      const activityResult = await pool.query(`
        SELECT DATE(learned_at) as date, COUNT(*) as count
        FROM visitor_word_progress
        WHERE ip = $1 AND learned_at >= NOW() - INTERVAL '28 days'
        GROUP BY DATE(learned_at)
        ORDER BY DATE(learned_at) ASC
      `, [ip]);

      const activityData = activityResult.rows.map(row => ({
        date: new Date(row.date).toISOString().split('T')[0],
        count: parseInt(row.count)
      }));

      // Calculate consecutive days
      let consecutiveDays = 0;
      const todayString = new Date().toISOString().split('T')[0];
      const todayIndex = activityData.findIndex(d => d.date === todayString);
      
      const checkDate = new Date();
      let dStr = checkDate.toISOString().split('T')[0];
      
      if (activityData.some(d => d.date === dStr)) {
          consecutiveDays++;
      }
      
      for(let i=1; i<28; i++) {
          checkDate.setDate(checkDate.getDate() - 1);
          dStr = checkDate.toISOString().split('T')[0];
          if (activityData.some(d => d.date === dStr)) {
              consecutiveDays++;
          } else if (i === 1 && consecutiveDays === 0) {
              continue; // didn't study today, but maybe yesterday
          } else {
              break;
          }
      }

      res.json({
        ip,
        dailyTarget: settings.daily_target,
        stats: {
          totalWords: parseInt(stats.total_words),
          coreWords: parseInt(stats.core_words || 0),
          lowFreqWords: parseInt(stats.low_freq_words || 0),
          learnedCount: parseInt(stats.learned_count),
          coreLearned: parseInt(stats.core_learned || 0),
          lowFreqLearned: parseInt(stats.low_freq_learned || 0),
          rememberedCount: parseInt(stats.learned_count),
          forgottenCount: parseInt(stats.forgotten_count),
          favoriteCount: parseInt(stats.favorite_count),
          remainingCount: parseInt(stats.total_words) - parseInt(stats.learned_count),
          activity: activityData,
          consecutiveDays
        },
        storage: "neon"
      });
    } catch (error) {
      console.error("Error in /api/me:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    const ip = getIp(req);
    const { dailyTarget } = req.body;
    try {
      await pool.query(
        "INSERT INTO visitor_settings (ip, daily_target) VALUES ($1, $2) ON CONFLICT (ip) DO UPDATE SET daily_target = EXCLUDED.daily_target",
        [ip, dailyTarget]
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/session", async (req, res) => {
    const ip = getIp(req);
    const limit = parseInt(req.query.limit as string) || 30;
    try {
      // Get words not learned yet
      const result = await pool.query(`
        SELECT i.* 
        FROM idioms i
        LEFT JOIN visitor_word_progress p ON i.word = p.word AND p.ip = $1
        WHERE char_length(i.word) >= 4 
          AND i.word !~ '[A-Za-z0-9@]'
          AND (p.remembered IS NULL OR p.remembered = false)
        ORDER BY i.reliability_level ASC, i.priority_score DESC, i.frequency DESC
        LIMIT $2
      `, [ip, limit]);

      res.json({
        words: result.rows,
        dailyTarget: limit,
        storage: "neon"
      });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/answer", async (req, res) => {
    const ip = getIp(req);
    const { word, remembered } = req.body;
    try {
      await pool.query(`
        INSERT INTO visitor_word_progress (ip, word, remembered, learned_at, updated_at, mistakes_count)
        VALUES ($1, $2, $3, NOW(), NOW(), CASE WHEN $3 = false THEN 1 ELSE 0 END)
        ON CONFLICT (ip, word) 
        DO UPDATE SET 
          remembered = EXCLUDED.remembered,
          learned_at = CASE WHEN EXCLUDED.remembered = true THEN NOW() ELSE visitor_word_progress.learned_at END,
          mistakes_count = CASE WHEN EXCLUDED.remembered = false THEN visitor_word_progress.mistakes_count + 1 ELSE visitor_word_progress.mistakes_count END,
          updated_at = NOW()
      `, [ip, word, remembered]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/favorite", async (req, res) => {
    const ip = getIp(req);
    const { word } = req.body;
    try {
      await pool.query(`
        INSERT INTO visitor_word_progress (ip, word, favorite, favorited_at, updated_at)
        VALUES ($1, $2, true, NOW(), NOW())
        ON CONFLICT (ip, word) 
        DO UPDATE SET 
          favorite = NOT visitor_word_progress.favorite,
          favorited_at = CASE WHEN NOT visitor_word_progress.favorite THEN NOW() ELSE visitor_word_progress.favorited_at END,
          updated_at = NOW()
      `, [ip, word]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/reset", async (req, res) => {
    const ip = getIp(req);
    try {
      await pool.query('DELETE FROM visitor_word_progress WHERE ip = $1', [ip]);
      res.json({ success: true });
    } catch (error) {
      console.error('Reset error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/words", async (req, res) => {
    const ip = getIp(req);
    const type = req.query.type as string; // 'learned', 'remaining', 'difficult', 'favorites', 'core', 'all'
    const category = req.query.category as string; // '1' (high freq), '2' (low freq), 'all'
    const limit = parseInt(req.query.limit as string) || 500;
    const offset = parseInt(req.query.offset as string) || 0;
    try {
      let query = `
        SELECT i.*, p.remembered, p.favorite
        FROM idioms i
        LEFT JOIN visitor_word_progress p ON i.word = p.word AND p.ip = $1
        WHERE char_length(i.word) >= 4 AND i.word !~ '[A-Za-z0-9@]'
      `;

      if (category === '1') {
        query += " AND i.frequency > 5";
      } else if (category === '2') {
        query += " AND i.frequency <= 5";
      }

      if (type === "learned") {
        query += " AND p.remembered = true";
      } else if (type === "remaining") {
        query += " AND (p.remembered IS NULL OR p.remembered = false)";
      } else if (type === "difficult") {
        query += " AND p.mistakes_count >= 5";
      } else if (type === "favorites") {
        query += " AND p.favorite = true";
      } else if (type === "core") {
        query += " AND i.frequency >= 6";
      }

      query += " ORDER BY i.reliability_level ASC, i.priority_score DESC, i.frequency DESC LIMIT $2 OFFSET $3";
      
      const result = await pool.query(query, [ip, limit, offset]);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/word/:word", async (req, res) => {
    const { word } = req.params;
    try {
      const result = await pool.query("SELECT * FROM idioms WHERE word = $1", [word]);
      res.json(result.rows[0] || null);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Review session logic (based on memory curve)
  app.get("/api/review-session", async (req, res) => {
    const ip = getIp(req);
    try {
      // Memory curve intervals in days: 1, 2, 4, 7, 15, 30
      // For simplicity, we'll fetch words where (now - learned_at) matches these approximate intervals
      // Or simply words that were remembered=false
      const result = await pool.query(`
        SELECT i.*, p.learned_at
        FROM idioms i
        JOIN visitor_word_progress p ON i.word = p.word AND p.ip = $1
        WHERE (p.remembered = false)
           OR (p.remembered = true AND (
              (p.learned_at < NOW() - INTERVAL '1 day' AND p.learned_at > NOW() - INTERVAL '2 days') OR
              (p.learned_at < NOW() - INTERVAL '2 days' AND p.learned_at > NOW() - INTERVAL '3 days') OR
              (p.learned_at < NOW() - INTERVAL '4 days' AND p.learned_at > NOW() - INTERVAL '5 days') OR
              (p.learned_at < NOW() - INTERVAL '7 days' AND p.learned_at > NOW() - INTERVAL '8 days') OR
              (p.learned_at < NOW() - INTERVAL '15 days' AND p.learned_at > NOW() - INTERVAL '16 days') OR
              (p.learned_at < NOW() - INTERVAL '30 days')
           ))
        ORDER BY p.learned_at ASC
        LIMIT 50
      `, [ip]);

      res.json({
        words: result.rows,
        storage: "neon"
      });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Connection test
    pool.query("SELECT NOW()", (err, res) => {
       if (err) console.error("Database connection failed:", err.message);
       else {
         console.log("Database connected at:", res.rows[0].now);
         pool.query('ALTER TABLE visitor_word_progress ADD COLUMN mistakes_count INT DEFAULT 0').catch(() => {});
       }
    });
  });
}

startServer();
