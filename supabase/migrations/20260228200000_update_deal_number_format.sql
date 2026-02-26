-- Migration: Update deal number format from INV-* to D-XXXX
-- Converts all existing deal numbers to the new D-XXXX format,
-- maintaining sequential ordering per team.

-- Migrate deal numbers in the deals table
WITH numbered_deals AS (
  SELECT
    id,
    team_id,
    deal_number,
    ROW_NUMBER() OVER (
      PARTITION BY team_id
      ORDER BY
        CAST(SUBSTRING(deal_number FROM '[0-9]+$') AS INTEGER)
    ) AS new_seq
  FROM deals
  WHERE deal_number IS NOT NULL
)
UPDATE deals d
SET deal_number = 'D-' || LPAD(nd.new_seq::text, 4, '0')
FROM numbered_deals nd
WHERE d.id = nd.id;

-- Migrate any deal numbers in the inbox table
UPDATE inbox
SET deal_number = 'D-' || LPAD(
  SUBSTRING(deal_number FROM '[0-9]+$')::text,
  4, '0'
)
WHERE deal_number LIKE 'INV-%';
