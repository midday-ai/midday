-- Recurring Transactions table
CREATE TABLE recurring_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL,
  stream_id TEXT UNIQUE NOT NULL,
  category TEXT[],
  category_id TEXT,
  description TEXT,
  merchant_name TEXT,
  first_date DATE,
  last_date DATE,
  frequency TEXT,
  average_amount NUMERIC,
  last_amount NUMERIC,
  is_active BOOLEAN,
  status TEXT,
  transaction_type TEXT CHECK (transaction_type IN ('inflow', 'outflow')),
  is_user_modified BOOLEAN DEFAULT false,
  last_user_modified_datetime TIMESTAMP DEFAULT '0001-01-01T00:00:00Z'
);

-- Personal Finance Categories table
CREATE TABLE personal_finance_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recurring_transaction_id UUID REFERENCES recurring_transactions(id),
  primary_category TEXT,
  detailed_category TEXT,
  confidence_level TEXT
);

-- Transaction IDs table (for many-to-one relationship)
CREATE TABLE transaction_ids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recurring_transaction_id UUID REFERENCES recurring_transactions(id),
  transaction_id TEXT
);

-- Function to insert a recurring transaction
CREATE OR REPLACE FUNCTION insert_recurring_transaction(
  p_transaction JSONB
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Insert into recurring_transactions table
  INSERT INTO recurring_transactions (
    account_id, stream_id, category, category_id, description, merchant_name,
    first_date, last_date, frequency, average_amount, last_amount,
    is_active, status, transaction_type, is_user_modified, last_user_modified_datetime
  )
  VALUES (
    (p_transaction->>'account_id'),
    (p_transaction->>'stream_id'),
    (SELECT ARRAY(SELECT jsonb_array_elements_text(p_transaction->'category'))),
    (p_transaction->>'category_id'),
    (p_transaction->>'description'),
    (p_transaction->>'merchant_name'),
    (p_transaction->>'first_date')::DATE,
    (p_transaction->>'last_date')::DATE,
    (p_transaction->>'frequency'),
    ((p_transaction->'average_amount'->>'amount')::NUMERIC),
    ((p_transaction->'last_amount'->>'amount')::NUMERIC),
    (p_transaction->>'is_active')::BOOLEAN,
    (p_transaction->>'status'),
    CASE 
      WHEN p_transaction->>'transaction_type' IS NOT NULL THEN p_transaction->>'transaction_type'
      ELSE 
        CASE 
          WHEN (p_transaction->'average_amount'->>'amount')::NUMERIC >= 0 THEN 'inflow'
          ELSE 'outflow'
        END
    END,
    (p_transaction->>'is_user_modified')::BOOLEAN,
    (p_transaction->>'last_user_modified_datetime')::TIMESTAMP
  )
  RETURNING id INTO v_id;

  -- Insert into personal_finance_categories table
  INSERT INTO personal_finance_categories (
    recurring_transaction_id, primary_category, detailed_category, confidence_level
  )
  VALUES (
    v_id,
    (p_transaction->'personal_finance_category'->>'primary'),
    (p_transaction->'personal_finance_category'->>'detailed'),
    (p_transaction->'personal_finance_category'->>'confidence_level')
  );

  -- Insert transaction IDs
  INSERT INTO transaction_ids (recurring_transaction_id, transaction_id)
  SELECT v_id, jsonb_array_elements_text(p_transaction->'transaction_ids');

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to insert all recurring transactions
CREATE OR REPLACE FUNCTION insert_recurring_transactions(p_data JSONB) RETURNS VOID AS $$
DECLARE
  v_transaction JSONB;
BEGIN
  -- Insert inflow transactions
  FOR v_transaction IN SELECT * FROM jsonb_array_elements(p_data->'data'->'inflow')
  LOOP
    PERFORM insert_recurring_transaction(v_transaction);
  END LOOP;

  -- Insert outflow transactions
  FOR v_transaction IN SELECT * FROM jsonb_array_elements(p_data->'data'->'outflow')
  LOOP
    PERFORM insert_recurring_transaction(v_transaction);
  END LOOP;
END;
$$ LANGUAGE plpgsql;
