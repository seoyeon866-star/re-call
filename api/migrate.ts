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
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recalls_category ON recalls(category);
CREATE INDEX IF NOT EXISTS idx_recalls_reg_dt ON recalls(recall_reg_dt DESC NULLS LAST);
`;

export default async function handler(req: any, res: any) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const ref = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
    const regions = ['ap-southeast-1', 'us-east-1', 'ap-northeast-1', 'eu-west-1'];

    let migrated = false;
    let lastErr = '';

    for (const region of regions) {
      try {
        const client = new Client({
          host: `aws-0-${region}.pooler.supabase.com`,
          port: 6543,
          database: 'postgres',
          user: `postgres.${ref}`,
          password: serviceKey,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 5000,
        });
        await client.connect();
        await client.query(migrationSQL);
        await client.end();
        migrated = true;
        break;
      } catch (e: any) {
        lastErr = e.message;
      }
    }

    if (migrated) {
      res.json({ success: true, message: 'Migration completed successfully' });
    } else {
      res.status(500).json({ success: false, error: lastErr || 'Could not connect to database' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
