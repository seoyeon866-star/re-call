import { createRequire } from 'module';
import { readFileSync } from 'fs';
const require = createRequire(import.meta.url);
const { Client } = require('pg');

const envText = readFileSync('.env', 'utf-8');
const env = {};
for (const line of envText.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i === -1) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^"/, '').replace(/"$/, '');
}

const supabaseUrl = env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const ref = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
const directHost = `db.${ref}.supabase.co`;

const ports = [5432, 6543];

const sql = `
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_recalls_product_nm_trgm ON recalls USING gin (product_nm gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_recalls_makr_trgm ON recalls USING gin (makr gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_recalls_bsnm_nm_trgm ON recalls USING gin (bsnm_nm gin_trgm_ops);
`;

const regions = [
  'ap-southeast-1',
  'us-east-1',
  'ap-northeast-1',
  'eu-west-1',
];

async function tryConnect(host, port) {
  const client = new Client({
    host, port,
    database: 'postgres',
    user: `postgres.${ref}`,
    password: serviceKey,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });
  await client.connect();
  return client;
}

(async () => {
  const regionHosts = [
    'ap-southeast-1.pooler.supabase.com',
    'us-east-1.pooler.supabase.com',
    'ap-northeast-1.pooler.supabase.com',
    'eu-west-1.pooler.supabase.com',
    'aws-0-ap-southeast-1.pooler.supabase.com',
    'aws-0-us-east-1.pooler.supabase.com',
    'aws-0-ap-northeast-1.pooler.supabase.com',
    'aws-0-eu-west-1.pooler.supabase.com',
  ];
  const attempts = [];
  for (const host of regionHosts) {
    for (const port of [5432, 6543]) {
      attempts.push({ host, port });
    }
  }

  for (const { host, port } of attempts) {
    try {
      const client = await tryConnect(host, port);
      await client.query(sql);
      await client.end();
      console.log(`SUCCESS: ${host}:${port}`);
      process.exit(0);
    } catch (e) {
      console.log(`FAIL: ${host}:${port} - ${e.message}`);
    }
  }
  console.log('All failed');
  process.exit(1);
})();
