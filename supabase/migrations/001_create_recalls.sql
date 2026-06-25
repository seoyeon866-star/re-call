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
