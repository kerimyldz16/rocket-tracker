const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const app = express();
const PORT = 5000;

require("dotenv").config();

const pool = new Pool({
  user: process.env.POSTGRESQL_DATABASE_USER,
  host: process.env.POSTGRESQL_DATABASE_HOST,
  database: process.env.POSTGRESQL_DATABASE,
  password: process.env.POSTGRESQL_DATABASE_PASSWORD,
  port: 5432,
});

app.use(cors());

app.get("/locations/count", async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM locations");
    const count = result.rows[0].count; // Toplam kayıt sayısı
    res.json({ count: parseInt(count, 10) });
  } catch (error) {
    console.error("Error fetching count:", error);
    res.status(500).json({ error: "Server error" });
  }
  app.get("/locations/:index", async (req, res) => {
    const index = parseInt(req.params.index, 10);

    try {
      // Belirli bir sıradaki kaydı al
      const result = await pool.query(
        "SELECT * FROM locations ORDER BY id LIMIT 1 OFFSET $1",
        [index]
      );

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "No location found for the given index" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching location:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
