-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Status enum
CREATE TYPE transaction_status_enum AS ENUM (
  'pending', 'processing', 'success', 'failed', 'expired'
);

-- Main transactions table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT NOT NULL,
    alternative_contact TEXT,
    network TEXT NOT NULL CHECK (network IN ('MTN', 'Airtel', 'Glo', '9mobile')),
    data_plan_id TEXT NOT NULL,
    data_plan_name TEXT NOT NULL,
    cost_amount NUMERIC(10, 2) NOT NULL,
    wholesale_cost NUMERIC(10, 2) NOT NULL,
    payment_reference TEXT UNIQUE NOT NULL,
    virtual_account_num TEXT,
    virtual_bank_name TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    status transaction_status_enum DEFAULT 'pending' NOT NULL,
    aggregator_reference TEXT,
    error_log TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_transactions_payment_ref ON public.transactions(payment_reference);
CREATE INDEX idx_transactions_phone ON public.transactions(phone_number);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_created ON public.transactions(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transactions_modtime
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- RLS: server-only access (service role bypasses RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
-- No public policies — all access via service role key only
