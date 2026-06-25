import { Client } from 'pg';

const migrationSQL = `
CREATE TABLE IF NOT EXISTS recalls (
  recall_sn TEXT PRIMARY KEY,
  cntnts_id TEXT,
  product_nm TEXT,
  makr TEXT,
  bsnm_nm TEXT,
  modl_nm_info TEXT,
  shrtcom_cn TEXT,
  recall_se TEXT,
  hrmfl_grad TEXT,
  main_sleoffic TEXT,
  recall_img_urls TEXT,
  injry_cause_result TEXT,
  cnsmr_ghvr_tips TEXT,
  aditfield13 TEXT,
  recall_reg_dt TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recalls_category ON recalls(category);
CREATE INDEX IF NOT EXISTS idx_recalls_reg_dt ON recalls(recall_reg_dt DESC NULLS LAST);

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_recalls_product_nm_trgm ON recalls USING gin (product_nm gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_recalls_makr_trgm ON recalls USING gin (makr gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_recalls_bsnm_nm_trgm ON recalls USING gin (bsnm_nm gin_trgm_ops);
`;

export default async function handler(req: any, res: any) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const ref = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

    const targets: { host: string; port: number }[] = [];
    for (const region of ['ap-southeast-1', 'us-east-1', 'ap-northeast-1', 'eu-west-1']) {
      for (const port of [5432, 6543]) {
        targets.push({ host: `aws-0-${region}.pooler.supabase.com`, port });
      }
    }

    for (const { host, port } of targets) {
      try {
        const client = new Client({
          host, port,
          database: 'postgres',
          user: `postgres.${ref}`,
          password: serviceKey,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 5000,
        });
        await client.connect();
        await client.query(migrationSQL);
        await client.end();
        return res.json({ success: true, message: `Migration done via ${host}:${port}` });
      } catch (e: any) {
        continue;
      }
    }

    res.status(500).json({ success: false, error: 'Could not connect to database on any endpoint' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
