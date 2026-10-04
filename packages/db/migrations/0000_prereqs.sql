-- ===== 0000_prereqs: lead-verified on pgvector/pgvector:pg17 (2026-10-04). Paste into packages/db/migrations/0000_prereqs.sql (Phase 02). =====
-- ===== 0000 PREREQS: run BEFORE the Drizzle baseline CREATE TABLEs =====
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_bytes()
CREATE EXTENSION IF NOT EXISTS unaccent;  -- slugify()
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- gin_trgm_ops, similarity(), word_similarity()
CREATE EXTENSION IF NOT EXISTS vector;    -- vector(768) columns

-- inbox.fts generated column (schema.ts:2483-2486). Bodies: 20240624104607:249-258, :328-334. IMMUTABLE required.
CREATE OR REPLACE FUNCTION public.extract_product_names(products_json json) RETURNS text
LANGUAGE plpgsql IMMUTABLE AS $$
begin
  return (select string_agg(value, ',') from json_array_elements_text(products_json) as arr(value));
end;
$$;

CREATE OR REPLACE FUNCTION public.generate_inbox_fts(display_name_text text, product_names text) RETURNS tsvector
LANGUAGE plpgsql IMMUTABLE AS $$
begin
  return to_tsvector('english', coalesce(display_name_text, '') || ' ' || coalesce(product_names, ''));
end;
$$;

-- teams.inbox_id DEFAULT generate_inbox(10). Body 20240624104607:295-313 (extensions.gen_random_bytes -> gen_random_bytes)
CREATE OR REPLACE FUNCTION public.generate_inbox(size integer) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  bytes BYTEA := gen_random_bytes(size);
  l INT := length(characters);
  i INT := 0;
  output TEXT := '';
BEGIN
  WHILE i < size LOOP
    output := output || substr(characters, get_byte(bytes, i) % l + 1, 1);
    i := i + 1;
  END LOOP;
  RETURN lower(output);
END;
$$;

-- user_invites.code DEFAULT nanoid(24). Bodies 20240624104607:745-837 (extensions.gen_random_bytes -> gen_random_bytes)
CREATE OR REPLACE FUNCTION public.nanoid_optimized(size integer, alphabet text, mask integer, step integer) RETURNS text
LANGUAGE plpgsql PARALLEL SAFE AS $$
DECLARE
  idBuilder text := ''; counter int := 0; bytes bytea; alphabetIndex int;
  alphabetArray text[]; alphabetLength int := 64;
BEGIN
  alphabetArray := regexp_split_to_array(alphabet, '');
  alphabetLength := array_length(alphabetArray, 1);
  LOOP
    bytes := gen_random_bytes(step);
    FOR counter IN 0..step - 1 LOOP
      alphabetIndex := (get_byte(bytes, counter) & mask) + 1;
      IF alphabetIndex <= alphabetLength THEN
        idBuilder := idBuilder || alphabetArray[alphabetIndex];
        IF length(idBuilder) = size THEN RETURN idBuilder; END IF;
      END IF;
    END LOOP;
  END LOOP;
END
$$;

CREATE OR REPLACE FUNCTION public.nanoid(
  size integer DEFAULT 21,
  alphabet text DEFAULT '_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  additionalbytesfactor double precision DEFAULT 1.6) RETURNS text
LANGUAGE plpgsql PARALLEL SAFE AS $$
DECLARE
  alphabetArray text[]; alphabetLength int := 64; mask int := 63; step int := 34;
BEGIN
  IF size IS NULL OR size < 1 THEN RAISE EXCEPTION 'The size must be defined and greater than 0!'; END IF;
  IF alphabet IS NULL OR length(alphabet) = 0 OR length(alphabet) > 255 THEN
    RAISE EXCEPTION 'The alphabet can''t be undefined, zero or bigger than 255 symbols!';
  END IF;
  IF additionalBytesFactor IS NULL OR additionalBytesFactor < 1 THEN
    RAISE EXCEPTION 'The additional bytes factor can''t be less than 1!';
  END IF;
  alphabetArray := regexp_split_to_array(alphabet, '');
  alphabetLength := array_length(alphabetArray, 1);
  mask := (2 << cast(floor(log(alphabetLength - 1) / log(2)) as int)) - 1;
  step := cast(ceil(additionalBytesFactor * mask * size / alphabetLength) AS int);
  IF step > 1024 THEN step := 1024; END IF;
  RETURN nanoid_optimized(size, alphabet, mask, step);
END
$$;
