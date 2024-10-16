-- Function to insert a recurring transaction
CREATE OR REPLACE FUNCTION insert_recurring_transaction(
  p_transaction JSONB
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_existing_id UUID;
BEGIN
  -- Check if a transaction with the same stream_id already exists
  SELECT id INTO v_existing_id
  FROM recurring_transactions
  WHERE stream_id = (p_transaction->>'stream_id');

  IF v_existing_id IS NOT NULL THEN
    -- Update the existing record
    UPDATE recurring_transactions
    SET
      account_id = (p_transaction->>'account_id'),
      category = (SELECT ARRAY(SELECT jsonb_array_elements_text(p_transaction->'category'))),
      category_id = (p_transaction->>'category_id'),
      description = (p_transaction->>'description'),
      merchant_name = (p_transaction->>'merchant_name'),
      first_date = (p_transaction->>'first_date')::DATE,
      last_date = (p_transaction->>'last_date')::DATE,
      frequency = (p_transaction->>'frequency'),
      average_amount = ((p_transaction->'average_amount'->>'amount')::NUMERIC),
      last_amount = ((p_transaction->'last_amount'->>'amount')::NUMERIC),
      is_active = (p_transaction->>'is_active')::BOOLEAN,
      status = (p_transaction->>'status'),
      transaction_type = CASE 
        WHEN p_transaction->>'transaction_type' IS NOT NULL THEN p_transaction->>'transaction_type'
        ELSE 
          CASE 
            WHEN (p_transaction->'average_amount'->>'amount')::NUMERIC >= 0 THEN 'inflow'
            ELSE 'outflow'
          END
      END,
      is_user_modified = (p_transaction->>'is_user_modified')::BOOLEAN,
      last_user_modified_datetime = (p_transaction->>'last_user_modified_datetime')::TIMESTAMP
    WHERE id = v_existing_id;

    v_id := v_existing_id;
  ELSE
    -- Insert new record
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
  END IF;

  -- Update or insert personal_finance_categories
  INSERT INTO personal_finance_categories (
    recurring_transaction_id, primary_category, detailed_category, confidence_level
  )
  VALUES (
    v_id,
    (p_transaction->'personal_finance_category'->>'primary'),
    (p_transaction->'personal_finance_category'->>'detailed'),
    (p_transaction->'personal_finance_category'->>'confidence_level')
  )
  ON CONFLICT (recurring_transaction_id) DO UPDATE
  SET
    primary_category = EXCLUDED.primary_category,
    detailed_category = EXCLUDED.detailed_category,
    confidence_level = EXCLUDED.confidence_level;

  -- Update transaction IDs
  DELETE FROM transaction_ids WHERE recurring_transaction_id = v_id;
  INSERT INTO transaction_ids (recurring_transaction_id, transaction_id)
  SELECT v_id, jsonb_array_elements_text(p_transaction->'transaction_ids');

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;
