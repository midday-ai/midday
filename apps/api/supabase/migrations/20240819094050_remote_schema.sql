-- Enable RLS on the products table if not already enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select access." ON public.products FOR SELECT USING (true);

-- Policy to allow inserts
CREATE POLICY "Allow insert access." 
ON public.products 
FOR INSERT 
WITH CHECK (true);

-- Policy to allow updates
CREATE POLICY "Allow update access." 
ON public.products 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- Enable RLS on the prices table if not already enabled
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select access." ON public.prices FOR SELECT USING (true);

-- Policy to allow inserts
CREATE POLICY "Allow insert access." 
ON public.prices 
FOR INSERT 
WITH CHECK (true);

-- Policy to allow updates
CREATE POLICY "Allow update access." 
ON public.prices 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- Enable RLS on the subscriptions table if not already enabled
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select access." ON public.subscriptions FOR SELECT USING (true);

-- Policy to allow inserts
CREATE POLICY "Allow insert access." 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (true);

-- Policy to allow updates
CREATE POLICY "Allow update access." 
ON public.subscriptions 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- Enable RLS on the customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Policy to allow select access
CREATE POLICY "Allow select access." ON public.customers FOR SELECT USING (true);

-- Policy to allow inserts
CREATE POLICY "Allow insert access." ON public.customers FOR INSERT WITH CHECK (true);

-- Policy to allow updates
CREATE POLICY "Allow update access." ON public.customers FOR UPDATE USING (true) WITH CHECK (true);