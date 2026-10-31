import { Pool } from "pg";

async function main() {
  const url = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;
  if (!url) {
    console.log("NO_DB_URL");
    return;
  }
  const pool = new Pool({ connectionString: url, max: 1, idleTimeoutMillis: 5000, connectionTimeoutMillis: 5000 });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand VARCHAR(100) NOT NULL,
        model VARCHAR(200) NOT NULL,
        model_year INTEGER NOT NULL,
        aed_price NUMERIC(14,2) NOT NULL,
        images TEXT[] NOT NULL DEFAULT '{}',
        specifications JSONB NOT NULL DEFAULT '{}',
        mileage INTEGER NOT NULL DEFAULT 0,
        engine_capacity INTEGER NOT NULL DEFAULT 0,
        fuel_type VARCHAR(20) NOT NULL DEFAULT 'petrol',
        transmission VARCHAR(20) NOT NULL DEFAULT 'automatic',
        features TEXT[] NOT NULL DEFAULT '{}',
        description TEXT NOT NULL DEFAULT '',
        status VARCHAR(20) NOT NULL DEFAULT 'available',
        is_published BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS app_kv (key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    `);

    await pool.query(
      `INSERT INTO vehicles (brand,model,model_year,aed_price,images,specifications,mileage,engine_capacity,fuel_type,transmission,features,description,status,is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT DO NOTHING`,
      ["Toyota", "RAV4", 2023, 60000, [], "{}", 12000, 2000, "petrol", "automatic", [], "", "available", true]
    );
    await pool.query(
      `INSERT INTO vehicles (brand,model,model_year,aed_price,images,specifications,mileage,engine_capacity,fuel_type,transmission,features,description,status,is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT DO NOTHING`,
      ["BMW", "530", 2021, 95000, [], "{}", 38000, 2000, "petrol", "automatic", [], "", "available", true]
    );
    await pool.query(`DELETE FROM app_kv WHERE key='seeded'`);

    const rows1 = await pool.query(`SELECT * FROM vehicles WHERE model_year >= $1 AND model_year <= $2 ORDER BY model_year DESC LIMIT $3 OFFSET $4`, [2022, 2023, 5, 0]);
    console.log("ROWS1", rows1.rowCount, rows1.rows.map(r => r.brand+"|"+r.model_year).join(", "));

    const rows2 = await pool.query(`SELECT COUNT(*)::int AS n FROM vehicles WHERE model_year >= $1 AND model_year <= $2`, [2022, 2023]);
    console.log("COUNT", rows2.rows[0].n);

    console.log("DB_CHECK_OK");
  } catch (e) {
    console.log("DB_CHECK_FAIL", (e as { code?: string } | null)?.code, String(e));
  } finally {
    await pool.end().catch(() => {});
  }
}

main();
