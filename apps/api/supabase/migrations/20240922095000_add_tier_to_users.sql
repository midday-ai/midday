-- Create an enum type for the tier
CREATE TYPE user_tier AS ENUM ('free', 'pro', 'enterprise');

-- Add the tier column to the public.users table
ALTER TABLE public.users ADD COLUMN tier user_tier NOT NULL DEFAULT 'free';

-- Create a function to determine the tier based on subscription
CREATE OR REPLACE FUNCTION public.determine_user_tier()
RETURNS TRIGGER AS $$
DECLARE
    new_tier user_tier;
BEGIN
    -- Determine the new tier based on the subscription
    SELECT
        CASE
            WHEN EXISTS (
                SELECT 1 FROM public.subscriptions s
                JOIN public.prices p ON s.price_id = p.id
                WHERE s.user_id = NEW.user_id AND p.product_id = 'prod_enterprise'
            ) THEN 'enterprise'::user_tier
            WHEN EXISTS (
                SELECT 1 FROM public.subscriptions s
                JOIN public.prices p ON s.price_id = p.id
                WHERE s.user_id = NEW.user_id AND p.product_id = 'prod_pro'
            ) THEN 'pro'::user_tier
            ELSE 'free'::user_tier
        END INTO new_tier;

    -- Update the user's tier if it's different
    UPDATE public.users
    SET tier = new_tier
    WHERE id = NEW.user_id AND tier IS DISTINCT FROM new_tier;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a subscription is added or updated
CREATE TRIGGER update_user_tier_on_subscription
AFTER INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.determine_user_tier();

-- Grant necessary permissions
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.prices TO authenticated;
GRANT UPDATE (tier) ON public.users TO authenticated;