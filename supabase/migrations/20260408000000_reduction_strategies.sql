-- Reduction Strategies & Initiatives
-- Core module for tracking emission reduction plans and concrete action items.

-- ── reduction_strategies ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reduction_strategies (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id               UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title                    TEXT NOT NULL,
  description              TEXT,
  category                 TEXT NOT NULL CHECK (category IN (
                             'energy_efficiency', 'renewable_energy', 'fleet',
                             'supply_chain', 'waste', 'water', 'behavioral', 'other'
                           )),
  scope                    INTEGER CHECK (scope IN (1, 2, 3)),
  priority                 TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status                   TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
                             'draft', 'active', 'completed', 'cancelled', 'on_hold'
                           )),
  target_id                UUID REFERENCES emission_targets(id) ON DELETE SET NULL,
  estimated_reduction_co2e NUMERIC CHECK (estimated_reduction_co2e >= 0),
  estimated_cost           NUMERIC CHECK (estimated_cost >= 0),
  actual_reduction_co2e    NUMERIC CHECK (actual_reduction_co2e >= 0),
  responsible_person       TEXT,
  start_date               DATE,
  target_completion_date   DATE,
  actual_completion_date   DATE,
  notes                    TEXT,
  is_ai_generated          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── strategy_initiatives ──────────────────────────────────────────────────────
-- Concrete action items (tasks) that belong to a strategy.
CREATE TABLE IF NOT EXISTS strategy_initiatives (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id              UUID NOT NULL REFERENCES reduction_strategies(id) ON DELETE CASCADE,
  title                    TEXT NOT NULL,
  description              TEXT,
  status                   TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                             'pending', 'in_progress', 'completed', 'cancelled'
                           )),
  assigned_to              TEXT,
  due_date                 DATE,
  completed_date           DATE,
  estimated_cost           NUMERIC CHECK (estimated_cost >= 0),
  actual_cost              NUMERIC CHECK (actual_cost >= 0),
  estimated_reduction_co2e NUMERIC CHECK (estimated_reduction_co2e >= 0),
  actual_reduction_co2e    NUMERIC CHECK (actual_reduction_co2e >= 0),
  sort_order               INTEGER NOT NULL DEFAULT 0,
  notes                    TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reduction_strategies_company_id  ON reduction_strategies (company_id);
CREATE INDEX IF NOT EXISTS idx_reduction_strategies_status      ON reduction_strategies (status);
CREATE INDEX IF NOT EXISTS idx_reduction_strategies_target_id   ON reduction_strategies (target_id);
CREATE INDEX IF NOT EXISTS idx_strategy_initiatives_strategy_id ON strategy_initiatives (strategy_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE reduction_strategies  ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_initiatives  ENABLE ROW LEVEL SECURITY;

-- reduction_strategies: company users see only their own; admins see all
CREATE POLICY "Users view own company strategies" ON reduction_strategies
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users insert own company strategies" ON reduction_strategies
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users update own company strategies" ON reduction_strategies
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users delete own company strategies" ON reduction_strategies
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- strategy_initiatives: access is derived through the parent strategy's company
CREATE POLICY "Users view own initiatives" ON strategy_initiatives
  FOR SELECT USING (
    strategy_id IN (
      SELECT id FROM reduction_strategies
      WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users insert own initiatives" ON strategy_initiatives
  FOR INSERT WITH CHECK (
    strategy_id IN (
      SELECT id FROM reduction_strategies
      WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users update own initiatives" ON strategy_initiatives
  FOR UPDATE USING (
    strategy_id IN (
      SELECT id FROM reduction_strategies
      WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users delete own initiatives" ON strategy_initiatives
  FOR DELETE USING (
    strategy_id IN (
      SELECT id FROM reduction_strategies
      WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
