-- Function to get monthly expenses
/**
 * Retrieves monthly expense totals for a given team, date range, and currency.
 *
 * @param team_id UUID - The unique identifier of the team
 * @param start_date DATE - The start date of the period to analyze
 * @param end_date DATE - The end date of the period to analyze
 * @param currency TEXT - The currency to filter transactions by
 * @return TABLE (month DATE, total_expense NUMERIC) - A table of monthly expense totals
 */
CREATE OR REPLACE FUNCTION public.get_monthly_expenses(
    team_id UUID,
    start_date DATE,
    end_date DATE,
    currency TEXT
)
RETURNS TABLE (
    month DATE,
    total_expense NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE_TRUNC('month', t.date)::DATE AS month,
        ABS(SUM(t.amount)) AS total_expense
    FROM
        transactions t
    WHERE
        t.team_id = get_monthly_expenses.team_id
        AND t.date BETWEEN start_date AND end_date
        AND t.currency = get_monthly_expenses.currency
        AND t.amount < 0
        AND t.category_slug != 'transfer'
    GROUP BY
        DATE_TRUNC('month', t.date)
    ORDER BY
        month;
END;
$$;

-- Function to get expenses by category
/**
 * Retrieves expense totals grouped by category for a given team, date range, and currency.
 *
 * @param team_id UUID - The unique identifier of the team
 * @param start_date DATE - The start date of the period to analyze
 * @param end_date DATE - The end date of the period to analyze
 * @param currency TEXT - The currency to filter transactions by
 * @return TABLE (category_name TEXT, category_slug TEXT, total_expense NUMERIC) - A table of expense totals by category
 */
CREATE OR REPLACE FUNCTION public.get_expenses_by_category(
    team_id UUID,
    start_date DATE,
    end_date DATE,
    currency TEXT
)
RETURNS TABLE (
    category_name TEXT,
    category_slug TEXT,
    total_expense NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(tc.name, 'Uncategorized') AS category_name,
        COALESCE(t.category_slug, 'uncategorized') AS category_slug,
        ABS(SUM(t.amount)) AS total_expense
    FROM
        transactions t
    LEFT JOIN
        transaction_categories tc ON t.category_slug = tc.slug AND t.team_id = tc.team_id
    WHERE
        t.team_id = get_expenses_by_category.team_id
        AND t.date BETWEEN start_date AND end_date
        AND t.currency = get_expenses_by_category.currency
        AND t.amount < 0
        AND t.category_slug != 'transfer'
    GROUP BY
        tc.name, t.category_slug
    ORDER BY
        total_expense DESC;
END;
$$;

-- Function to get daily expenses (for time-series charts)
/**
 * Retrieves daily expense totals for a given team, date range, and currency.
 *
 * @param team_id UUID - The unique identifier of the team
 * @param start_date DATE - The start date of the period to analyze
 * @param end_date DATE - The end date of the period to analyze
 * @param currency TEXT - The currency to filter transactions by
 * @return TABLE (date DATE, total_expense NUMERIC) - A table of daily expense totals
 */
CREATE OR REPLACE FUNCTION public.get_daily_expenses(
    team_id UUID,
    start_date DATE,
    end_date DATE,
    currency TEXT
)
RETURNS TABLE (
    date DATE,
    total_expense NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.date,
        ABS(SUM(t.amount)) AS total_expense
    FROM
        transactions t
    WHERE
        t.team_id = get_daily_expenses.team_id
        AND t.date BETWEEN start_date AND end_date
        AND t.currency = get_daily_expenses.currency
        AND t.amount < 0
        AND t.category_slug != 'transfer'
    GROUP BY
        t.date
    ORDER BY
        t.date;
END;
$$;

-- Function to get top expense categories
/**
 * Retrieves the top expense categories for a given team, date range, and currency.
 *
 * @param team_id UUID - The unique identifier of the team
 * @param start_date DATE - The start date of the period to analyze
 * @param end_date DATE - The end date of the period to analyze
 * @param currency TEXT - The currency to filter transactions by
 * @param limit_count INTEGER - The number of top categories to return (default: 5)
 * @return TABLE (category_name TEXT, category_slug TEXT, total_expense NUMERIC) - A table of top expense categories
 */
CREATE OR REPLACE FUNCTION public.get_top_expense_categories(
    team_id UUID,
    start_date DATE,
    end_date DATE,
    currency TEXT,
    limit_count INTEGER DEFAULT 5
)
RETURNS TABLE (
    category_name TEXT,
    category_slug TEXT,
    total_expense NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(tc.name, 'Uncategorized') AS category_name,
        COALESCE(t.category_slug, 'uncategorized') AS category_slug,
        ABS(SUM(t.amount)) AS total_expense
    FROM
        transactions t
    LEFT JOIN
        transaction_categories tc ON t.category_slug = tc.slug AND t.team_id = tc.team_id
    WHERE
        t.team_id = get_top_expense_categories.team_id
        AND t.date BETWEEN start_date AND end_date
        AND t.currency = get_top_expense_categories.currency
        AND t.amount < 0
        AND t.category_slug != 'transfer'
    GROUP BY
        tc.name, t.category_slug
    ORDER BY
        total_expense DESC
    LIMIT limit_count;
END;
$$;

-- Function to get expenses by merchant
/**
 * Retrieves expense totals grouped by merchant for a given team, date range, and currency.
 *
 * @param team_id UUID - The unique identifier of the team
 * @param start_date DATE - The start date of the period to analyze
 * @param end_date DATE - The end date of the period to analyze
 * @param currency TEXT - The currency to filter transactions by
 * @param limit_count INTEGER - The number of top merchants to return (default: 10)
 * @return TABLE (merchant_name TEXT, total_expense NUMERIC, transaction_count BIGINT) - A table of expense totals by merchant
 */
CREATE OR REPLACE FUNCTION public.get_expenses_by_merchant(
    team_id UUID,
    start_date DATE,
    end_date DATE,
    currency TEXT,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    merchant_name TEXT,
    total_expense NUMERIC,
    transaction_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(t.merchant_name, 'Unknown') AS merchant_name,
        ABS(SUM(t.amount)) AS total_expense,
        COUNT(*) AS transaction_count
    FROM
        transactions t
    WHERE
        t.team_id = get_expenses_by_merchant.team_id
        AND t.date BETWEEN start_date AND end_date
        AND t.currency = get_expenses_by_merchant.currency
        AND t.amount < 0
        AND t.category_slug != 'transfer'
    GROUP BY
        t.merchant_name
    ORDER BY
        total_expense DESC
    LIMIT limit_count;
END;
$$;

-- Function to get expense trends by week
/**
 * Retrieves weekly expense trends for a given team, date range, and currency.
 *
 * @param team_id UUID - The unique identifier of the team
 * @param start_date DATE - The start date of the period to analyze
 * @param end_date DATE - The end date of the period to analyze
 * @param currency TEXT - The currency to filter transactions by
 * @return TABLE (week DATE, total_expense NUMERIC, avg_daily_expense NUMERIC) - A table of weekly expense trends
 */
CREATE OR REPLACE FUNCTION public.get_weekly_expense_trends(
    team_id UUID,
    start_date DATE,
    end_date DATE,
    currency TEXT
)
RETURNS TABLE (
    week DATE,
    total_expense NUMERIC,
    avg_daily_expense NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE_TRUNC('week', t.date)::DATE AS week,
        ABS(SUM(t.amount)) AS total_expense,
        ABS(AVG(SUM(t.amount))) OVER (ORDER BY DATE_TRUNC('week', t.date) ROWS BETWEEN 3 PRECEDING AND CURRENT ROW) AS avg_daily_expense
    FROM
        transactions t
    WHERE
        t.team_id = get_weekly_expense_trends.team_id
        AND t.date BETWEEN start_date AND end_date
        AND t.currency = get_weekly_expense_trends.currency
        AND t.amount < 0
        AND t.category_slug != 'transfer'
    GROUP BY
        DATE_TRUNC('week', t.date)
    ORDER BY
        week;
END;
$$;

-- Function to get expenses by payment channel
/**
 * Retrieves expense totals grouped by payment channel for a given team, date range, and currency.
 *
 * @param team_id UUID - The unique identifier of the team
 * @param start_date DATE - The start date of the period to analyze
 * @param end_date DATE - The end date of the period to analyze
 * @param currency TEXT - The currency to filter transactions by
 * @return TABLE (payment_channel TEXT, total_expense NUMERIC, transaction_count BIGINT) - A table of expense totals by payment channel
 */
CREATE OR REPLACE FUNCTION public.get_expenses_by_payment_channel(
    team_id UUID,
    start_date DATE,
    end_date DATE,
    currency TEXT
)
RETURNS TABLE (
    payment_channel TEXT,
    total_expense NUMERIC,
    transaction_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(t.payment_channel, 'Unknown') AS payment_channel,
        ABS(SUM(t.amount)) AS total_expense,
        COUNT(*) AS transaction_count
    FROM
        transactions t
    WHERE
        t.team_id = get_expenses_by_payment_channel.team_id
        AND t.date BETWEEN start_date AND end_date
        AND t.currency = get_expenses_by_payment_channel.currency
        AND t.amount < 0
        AND t.category_slug != 'transfer'
    GROUP BY
        t.payment_channel
    ORDER BY
        total_expense DESC;
END;
$$;

-- Function to get recurring expenses
/**
 * Identifies and retrieves recurring expenses for a given team, date range, and currency.
 *
 * @param team_id UUID - The unique identifier of the team
 * @param start_date DATE - The start date of the period to analyze
 * @param end_date DATE - The end date of the period to analyze
 * @param currency TEXT - The currency to filter transactions by
 * @param min_occurrences INTEGER - The minimum number of occurrences to consider an expense recurring (default: 3)
 * @return TABLE (merchant_name TEXT, category_name TEXT, avg_amount NUMERIC, occurrence_count BIGINT) - A table of recurring expenses
 */
CREATE OR REPLACE FUNCTION public.get_recurring_expenses(
    team_id UUID,
    start_date DATE,
    end_date DATE,
    currency TEXT,
    min_occurrences INTEGER DEFAULT 3
)
RETURNS TABLE (
    merchant_name TEXT,
    category_name TEXT,
    avg_amount NUMERIC,
    occurrence_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH recurring_transactions AS (
        SELECT
            merchant_name,
            category_slug,
            ABS(AVG(amount)) AS avg_amount,
            COUNT(*) AS occurrence_count
        FROM
            transactions
        WHERE
            team_id = get_recurring_expenses.team_id
            AND date BETWEEN start_date AND end_date
            AND currency = get_recurring_expenses.currency
            AND amount < 0
            AND category_slug != 'transfer'
        GROUP BY
            merchant_name, category_slug
        HAVING
            COUNT(*) >= min_occurrences
    )
    SELECT
        rt.merchant_name,
        COALESCE(tc.name, 'Uncategorized') AS category_name,
        rt.avg_amount,
        rt.occurrence_count
    FROM
        recurring_transactions rt
    LEFT JOIN
        transaction_categories tc ON rt.category_slug = tc.slug AND tc.team_id = get_recurring_expenses.team_id
    ORDER BY
        rt.avg_amount DESC;
END;
$$;

-- Function to get expense distribution by day of week
/**
 * Retrieves the distribution of expenses by day of the week for a given team, date range, and currency.
 *
 * @param team_id UUID - The unique identifier of the team
 * @param start_date DATE - The start date of the period to analyze
 * @param end_date DATE - The end date of the period to analyze
 * @param currency TEXT - The currency to filter transactions by
 * @return TABLE (day_of_week INTEGER, day_name TEXT, total_expense NUMERIC, transaction_count BIGINT) - A table of expense distribution by day of week
 */
CREATE OR REPLACE FUNCTION public.get_expense_distribution_by_day_of_week(
    team_id UUID,
    start_date DATE,
    end_date DATE,
    currency TEXT
)
RETURNS TABLE (
    day_of_week INTEGER,
    day_name TEXT,
    total_expense NUMERIC,
    transaction_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        EXTRACT(DOW FROM t.date)::INTEGER AS day_of_week,
        TO_CHAR(t.date, 'Day') AS day_name,
        ABS(SUM(t.amount)) AS total_expense,
        COUNT(*) AS transaction_count
    FROM
        transactions t
    WHERE
        t.team_id = get_expense_distribution_by_day_of_week.team_id
        AND t.date BETWEEN start_date AND end_date
        AND t.currency = get_expense_distribution_by_day_of_week.currency
        AND t.amount < 0
        AND t.category_slug != 'transfer'
    GROUP BY
        EXTRACT(DOW FROM t.date),
        TO_CHAR(t.date, 'Day')
    ORDER BY
        day_of_week;
END;
$$;

-- Function to get expense growth rate
/**
 * Calculates the expense growth rate for a given team, date range, currency, and interval type.
 *
 * @param team_id UUID - The unique identifier of the team
 * @param start_date DATE - The start date of the period to analyze
 * @param end_date DATE - The end date of the period to analyze
 * @param currency TEXT - The currency to filter transactions by
 * @param interval_type TEXT - The type of interval to group expenses by (default: 'month')
 * @return TABLE (period DATE, total_expense NUMERIC, growth_rate NUMERIC) - A table of expense growth rates
 */
CREATE OR REPLACE FUNCTION public.get_expense_growth_rate(
    team_id UUID,
    start_date DATE,
    end_date DATE,
    currency TEXT,
    interval_type TEXT DEFAULT 'month'
)
RETURNS TABLE (
    period DATE,
    total_expense NUMERIC,
    growth_rate NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH period_expenses AS (
        SELECT
            DATE_TRUNC(interval_type, t.date)::DATE AS period,
            ABS(SUM(t.amount)) AS total_expense
        FROM
            transactions t
        WHERE
            t.team_id = get_expense_growth_rate.team_id
            AND t.date BETWEEN start_date AND end_date
            AND t.currency = get_expense_growth_rate.currency
            AND t.amount < 0
            AND t.category_slug != 'transfer'
        GROUP BY
            DATE_TRUNC(interval_type, t.date)
    )
    SELECT
        pe.period,
        pe.total_expense,
        CASE
            WHEN LAG(pe.total_expense) OVER (ORDER BY pe.period) IS NULL THEN NULL
            ELSE (pe.total_expense - LAG(pe.total_expense) OVER (ORDER BY pe.period)) / LAG(pe.total_expense) OVER (ORDER BY pe.period) * 100
        END AS growth_rate
    FROM
        period_expenses pe
    ORDER BY
        pe.period;
END;
$$;

-- Function to get expense forecast
/**
 * Generates an expense forecast for a given team, forecast date, currency, and lookback period.
 *
 * @param team_id UUID - The unique identifier of the team
 * @param forecast_date DATE - The date for which to forecast expenses
 * @param currency TEXT - The currency to filter transactions by
 * @param lookback_months INTEGER - The number of months to look back for calculating the forecast (default: 3)
 * @return TABLE (forecasted_date DATE, forecasted_expense NUMERIC) - A table containing the forecasted expense
 */
CREATE OR REPLACE FUNCTION public.get_expense_forecast(
    team_id UUID,
    forecast_date DATE,
    currency TEXT,
    lookback_months INTEGER DEFAULT 3
)
RETURNS TABLE (
    forecasted_date DATE,
    forecasted_expense NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    avg_monthly_expense NUMERIC;
BEGIN
    -- Calculate average monthly expense for the lookback period
    SELECT AVG(monthly_expense) INTO avg_monthly_expense
    FROM (
        SELECT DATE_TRUNC('month', t.date) AS month, ABS(SUM(t.amount)) AS monthly_expense
        FROM transactions t
        WHERE t.team_id = get_expense_forecast.team_id
          AND t.date >= (forecast_date - (lookback_months || ' months')::INTERVAL)
          AND t.date < forecast_date
          AND t.currency = get_expense_forecast.currency
          AND t.amount < 0
          AND t.category_slug != 'transfer'
        GROUP BY DATE_TRUNC('month', t.date)
        ORDER BY month DESC
        LIMIT lookback_months
    ) AS recent_months;

    -- Return the forecasted expense
    RETURN QUERY
    SELECT
        get_expense_forecast.forecast_date AS forecasted_date,
        COALESCE(avg_monthly_expense, 0) AS forecasted_expense;
END;
$$;

-- Function to get expense anomalies
/**
 * Identifies expense anomalies for a given team, date range, currency, and threshold percentage.
 *
 * @param team_id UUID - The unique identifier of the team
 * @param start_date DATE - The start date of the period to analyze
 * @param end_date DATE - The end date of the period to analyze
 * @param currency TEXT - The currency to filter transactions by
 * @param threshold_percentage NUMERIC - The percentage threshold for considering an expense anomalous (default: 50)
 * @return TABLE (transaction_date DATE, merchant_name TEXT, category_name TEXT, amount NUMERIC, avg_amount NUMERIC, percentage_difference NUMERIC) - A table of expense anomalies
 */
CREATE OR REPLACE FUNCTION public.get_expense_anomalies(
    team_id UUID,
    start_date DATE,
    end_date DATE,
    currency TEXT,
    threshold_percentage NUMERIC DEFAULT 50
)
RETURNS TABLE (
    transaction_date DATE,
    merchant_name TEXT,
    category_name TEXT,
    amount NUMERIC,
    avg_amount NUMERIC,
    percentage_difference NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH merchant_averages AS (
        SELECT
            merchant_name,
            AVG(ABS(amount)) AS avg_amount
        FROM
            transactions
        WHERE
            team_id = get_expense_anomalies.team_id
            AND date BETWEEN start_date AND end_date
            AND currency = get_expense_anomalies.currency
            AND amount < 0
            AND category_slug != 'transfer'
        GROUP BY
            merchant_name
    )
    SELECT
        t.date AS transaction_date,
        t.merchant_name,
        COALESCE(tc.name, 'Uncategorized') AS category_name,
        ABS(t.amount) AS amount,
        ma.avg_amount,
        (ABS(t.amount) - ma.avg_amount) / ma.avg_amount * 100 AS percentage_difference
    FROM
        transactions t
    JOIN
        merchant_averages ma ON t.merchant_name = ma.merchant_name
    LEFT JOIN
        transaction_categories tc ON t.category_slug = tc.slug AND t.team_id = tc.team_id
    WHERE
        t.team_id = get_expense_anomalies.team_id
        AND t.date BETWEEN start_date AND end_date
        AND t.currency = get_expense_anomalies.currency
        AND t.amount < 0
        AND t.category_slug != 'transfer'
        AND ABS((ABS(t.amount) - ma.avg_amount) / ma.avg_amount * 100) > threshold_percentage
    ORDER BY
        percentage_difference DESC;
END;
$$;

-- Function to get expense trends by time of day
/**
 * Retrieves expense trends by time of day for a given team, date range, and currency.
 *
 * @param team_id UUID - The unique identifier of the team
 * @param start_date DATE - The start date of the period to analyze
 * @param end_date DATE - The end date of the period to analyze
 * @param currency TEXT - The currency to filter transactions by
 * @return TABLE (hour_of_day INTEGER, total_expense NUMERIC, transaction_count BIGINT) - A table of expense trends by time of day
 */
CREATE OR REPLACE FUNCTION public.get_expense_trends_by_time_of_day(
    team_id UUID,
    start_date DATE,
    end_date DATE,
    currency TEXT
)
RETURNS TABLE (
    hour_of_day INTEGER,
    total_expense NUMERIC,
    transaction_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        EXTRACT(HOUR FROM t.datetime)::INTEGER AS hour_of_day,
        ABS(SUM(t.amount)) AS total_expense,
        COUNT(*) AS transaction_count
    FROM
        transactions t
    WHERE
        t.team_id = get_expense_trends_by_time_of_day.team_id
        AND t.date BETWEEN start_date AND end_date
        AND t.currency = get_expense_trends_by_time_of_day.currency
        AND t.amount < 0
        AND t.category_slug != 'transfer'
    GROUP BY
        EXTRACT(HOUR FROM t.datetime)
    ORDER BY
        hour_of_day;
END;
$$;

-- Function to get expense comparison (current period vs previous period)
/**
 * Compares expenses between the current period and the previous period for a given team, date range, and currency.
 *
 * @param team_id UUID - The unique identifier of the team
 * @param current_start_date DATE - The start date of the current period
 * @param current_end_date DATE - The end date of the current period
 * @param currency TEXT - The currency to filter transactions by
 * @return TABLE (category_name TEXT, current_period_expense NUMERIC, previous_period_expense NUMERIC, expense_difference NUMERIC, percentage_change NUMERIC) - A table comparing expenses between periods
 */
CREATE OR REPLACE FUNCTION public.get_expense_comparison(
    team_id UUID,
    current_start_date DATE,
    current_end_date DATE,
    currency TEXT
)
RETURNS TABLE (
    category_name TEXT,
    current_period_expense NUMERIC,
    previous_period_expense NUMERIC,
    expense_difference NUMERIC,
    percentage_change NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    period_length INTEGER;
BEGIN
    period_length := current_end_date - current_start_date + 1;

    RETURN QUERY
    WITH current_period AS (
        SELECT
            COALESCE(tc.name, 'Uncategorized') AS category_name,
            ABS(SUM(t.amount)) AS total_expense
        FROM
            transactions t
        LEFT JOIN
            transaction_categories tc ON t.category_slug = tc.slug AND t.team_id = tc.team_id
        WHERE
            t.team_id = get_expense_comparison.team_id
            AND t.date BETWEEN current_start_date AND current_end_date
            AND t.currency = get_expense_comparison.currency
            AND t.amount < 0
            AND t.category_slug != 'transfer'
        GROUP BY
            tc.name
    ),
    previous_period AS (
        SELECT
            COALESCE(tc.name, 'Uncategorized') AS category_name,
            ABS(SUM(t.amount)) AS total_expense
        FROM
            transactions t
        LEFT JOIN
            transaction_categories tc ON t.category_slug = tc.slug AND t.team_id = tc.team_id
        WHERE
            t.team_id = get_expense_comparison.team_id
            AND t.date BETWEEN (current_start_date - period_length::INTEGER) AND (current_end_date - period_length::INTEGER)
            AND t.currency = get_expense_comparison.currency
            AND t.amount < 0
            AND t.category_slug != 'transfer'
        GROUP BY
            tc.name
    )
    SELECT
        COALESCE(cp.category_name, pp.category_name) AS category_name,
        COALESCE(cp.total_expense, 0) AS current_period_expense,
        COALESCE(pp.total_expense, 0) AS previous_period_expense,
        COALESCE(cp.total_expense, 0) - COALESCE(pp.total_expense, 0) AS expense_difference,
        CASE
            WHEN COALESCE(pp.total_expense, 0) = 0 THEN NULL
            ELSE ((COALESCE(cp.total_expense, 0) - COALESCE(pp.total_expense, 0)) / COALESCE(pp.total_expense, 0)) * 100
        END AS percentage_change
    FROM
        current_period cp
    FULL OUTER JOIN
        previous_period pp ON cp.category_name = pp.category_name
    ORDER BY
        COALESCE(cp.total_expense, 0) DESC;
END;
$$;

-- Function to get expense breakdown by personal finance category
/**
 * Retrieves expense breakdown by personal finance category for a given team, date range, and currency.
 *
 * @param team_id UUID - The unique identifier of the team
 * @param start_date DATE - The start date of the period to analyze
 * @param end_date DATE - The end date of the period to analyze
 * @param currency TEXT - The currency to filter transactions by
 * @return TABLE (primary_category TEXT, detailed_category TEXT, total_expense NUMERIC, transaction_count BIGINT) - A table of expense breakdown by personal finance category
 */
CREATE OR REPLACE FUNCTION public.get_expense_by_personal_finance_category(
    team_id UUID,
    start_date DATE,
    end_date DATE,
    currency TEXT
)
RETURNS TABLE (
    primary_category TEXT,
    detailed_category TEXT,
    total_expense NUMERIC,
    transaction_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(t.personal_finance_category_primary, 'Uncategorized') AS primary_category,
        COALESCE(t.personal_finance_category_detailed, 'Uncategorized') AS detailed_category,
        ABS(SUM(t.amount)) AS total_expense,
        COUNT(*) AS transaction_count
    FROM
        transactions t
    WHERE
        t.team_id = get_expense_by_personal_finance_category.team_id
        AND t.date BETWEEN start_date AND end_date
        AND t.currency = get_expense_by_personal_finance_category.currency
        AND t.amount < 0
        AND t.category_slug != 'transfer'
    GROUP BY
        t.personal_finance_category_primary, t.personal_finance_category_detailed
    ORDER BY
        total_expense DESC;
END;
$$;

-- Function to analyze inventory costs
CREATE OR REPLACE FUNCTION public.get_inventory_cost_analysis(
    team_id UUID,
    start_date DATE,
    end_date DATE,
    currency TEXT
)
RETURNS TABLE (
    month DATE,
    total_expense NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE_TRUNC('month', t.date)::DATE AS month,
        ABS(SUM(t.amount)) AS total_expense
    FROM
        transactions t
    WHERE
        t.team_id = get_inventory_cost_analysis.team_id
        AND t.date BETWEEN start_date AND end_date
        AND t.currency = get_inventory_cost_analysis.currency
        AND t.amount < 0
        AND t.category_slug = 'inventory'
    GROUP BY
        DATE_TRUNC('month', t.date)
    ORDER BY
        month;
END;
$$;

-- Function to analyze rent and utilities
CREATE OR REPLACE FUNCTION public.get_rent_and_utilities_analysis(
    team_id UUID,
    start_date DATE,
    end_date DATE,
    currency TEXT
)
RETURNS TABLE (
    expense_type TEXT,
    total_expense NUMERIC,
    average_monthly_expense NUMERIC,
    trend_percentage NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH monthly_expenses AS (
        SELECT
            DATE_TRUNC('month', t.date) AS month,
            CASE
                WHEN t.category_slug = 'rent' THEN 'Rent'
                WHEN t.category_slug IN ('electricity', 'water', 'internet') THEN 'Utilities'
                ELSE 'Other'
            END AS expense_type,
            ABS(SUM(t.amount)) AS monthly_expense
        FROM
            transactions t
        WHERE
            t.team_id = get_rent_and_utilities_analysis.team_id
            AND t.date BETWEEN start_date AND end_date
            AND t.currency = get_rent_and_utilities_analysis.currency
            AND t.amount < 0
            AND t.category_slug IN ('rent', 'electricity', 'water', 'internet')
        GROUP BY
            DATE_TRUNC('month', t.date),
            CASE
                WHEN t.category_slug = 'rent' THEN 'Rent'
                WHEN t.category_slug IN ('electricity', 'water', 'internet') THEN 'Utilities'
                ELSE 'Other'
            END
    )
    SELECT
        me.expense_type,
        SUM(me.monthly_expense) AS total_expense,
        AVG(me.monthly_expense) AS average_monthly_expense,
        (LAST_VALUE(me.monthly_expense) OVER (PARTITION BY me.expense_type ORDER BY me.month) - 
         FIRST_VALUE(me.monthly_expense) OVER (PARTITION BY me.expense_type ORDER BY me.month)) / 
         NULLIF(FIRST_VALUE(me.monthly_expense) OVER (PARTITION BY me.expense_type ORDER BY me.month), 0) * 100 AS trend_percentage
    FROM
        monthly_expenses me
    GROUP BY
        me.expense_type;
END;
$$;

-- 18. Function to analyze salaries and wages
CREATE OR REPLACE FUNCTION public.get_salaries_and_wages_analysis(
    team_id UUID,
    start_date DATE,
    end_date DATE,
    currency TEXT
)
RETURNS TABLE (
    expense_type TEXT,
    total_expense NUMERIC,
    average_monthly_expense NUMERIC,
    employee_count BIGINT,
    avg_expense_per_employee NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH monthly_expenses AS (
        SELECT
            DATE_TRUNC('month', t.date) AS month,
            CASE
                WHEN t.category_slug = 'salary' THEN 'Salaries'
                WHEN t.category_slug = 'benefits' THEN 'Benefits'
                WHEN t.category_slug = 'overtime' THEN 'Overtime'
                ELSE 'Other Compensation'
            END AS expense_type,
            ABS(SUM(t.amount)) AS monthly_expense,
            COUNT(DISTINCT t.assigned_id) AS employee_count
        FROM
            transactions t
        WHERE
            t.team_id = get_salaries_and_wages_analysis.team_id
            AND t.date BETWEEN start_date AND end_date
            AND t.currency = get_salaries_and_wages_analysis.currency
            AND t.amount < 0
            AND t.category_slug IN ('salary', 'benefits', 'overtime', 'compensation')
        GROUP BY
            DATE_TRUNC('month', t.date),
            CASE
                WHEN t.category_slug = 'salary' THEN 'Salaries'
                WHEN t.category_slug = 'benefits' THEN 'Benefits'
                WHEN t.category_slug = 'overtime' THEN 'Overtime'
                ELSE 'Other Compensation'
            END
    )
    SELECT
        me.expense_type,
        SUM(me.monthly_expense) AS total_expense,
        AVG(me.monthly_expense) AS average_monthly_expense,
        MAX(me.employee_count) AS employee_count,
        SUM(me.monthly_expense) / NULLIF(MAX(me.employee_count), 0) AS avg_expense_per_employee
    FROM
        monthly_expenses me
    GROUP BY
        me.expense_type;
END;
$$;

-- 19. Function to analyze equipment and maintenance expenses
CREATE OR REPLACE FUNCTION public.get_equipment_and_maintenance_analysis(
    team_id UUID,
    start_date DATE,
    end_date DATE,
    currency TEXT
)
RETURNS TABLE (
    expense_type TEXT,
    total_expense NUMERIC,
    transaction_count BIGINT,
    avg_expense_per_transaction NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH equipment_expenses AS (
        SELECT
            CASE
                WHEN t.category_slug = 'equipment_purchase' THEN 'Equipment Purchase'
                WHEN t.category_slug = 'equipment_repair' THEN 'Equipment Repair'
                WHEN t.category_slug = 'equipment_maintenance' THEN 'Equipment Maintenance'
                ELSE 'Other Equipment'
            END AS expense_type,
            ABS(SUM(t.amount)) AS total_expense,
            COUNT(*) AS transaction_count
        FROM
            transactions t
        WHERE
            t.team_id = get_equipment_and_maintenance_analysis.team_id
            AND t.date BETWEEN start_date AND end_date
            AND t.currency = get_equipment_and_maintenance_analysis.currency
            AND t.amount < 0
            AND t.category_slug IN ('equipment_purchase', 'equipment_repair', 'equipment_maintenance')
        GROUP BY
            CASE
                WHEN t.category_slug = 'equipment_purchase' THEN 'Equipment Purchase'
                WHEN t.category_slug = 'equipment_repair' THEN 'Equipment Repair'
                WHEN t.category_slug = 'equipment_maintenance' THEN 'Equipment Maintenance'
                ELSE 'Other Equipment'
            END
    )
    SELECT
        ee.expense_type,
        ee.total_expense,
        ee.transaction_count,
        ee.total_expense / NULLIF(ee.transaction_count, 0) AS avg_expense_per_transaction
    FROM
        equipment_expenses ee
    ORDER BY
        ee.total_expense DESC;
END;
$$;

-- 13. Function to get expense breakdown by location
CREATE OR REPLACE FUNCTION public.get_expense_breakdown_by_location(
    team_id UUID,
    start_date DATE,
    end_date DATE,
    currency TEXT
)
RETURNS TABLE (
    location_city TEXT,
    location_region TEXT,
    location_country TEXT,
    total_expense NUMERIC,
    transaction_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(t.location_city, 'Unknown') AS location_city,
        COALESCE(t.location_region, 'Unknown') AS location_region,
        COALESCE(t.location_country, 'Unknown') AS location_country,
        ABS(SUM(t.amount)) AS total_expense,
        COUNT(*) AS transaction_count
    FROM
        transactions t
    WHERE
        t.team_id = get_expense_breakdown_by_location.team_id
        AND t.date BETWEEN start_date AND end_date
        AND t.currency = get_expense_breakdown_by_location.currency
        AND t.amount < 0
        AND t.category_slug != 'transfer'
    GROUP BY
        t.location_city, t.location_region, t.location_country
    ORDER BY
        total_expense DESC;
END;
$$;

-- 20. Function to analyze professional services expenses
CREATE OR REPLACE FUNCTION public.get_professional_services_analysis(
    team_id UUID,
    start_date DATE,
    end_date DATE,
    currency TEXT
)
RETURNS TABLE (
    service_type TEXT,
    total_expense NUMERIC,
    transaction_count BIGINT,
    avg_expense_per_transaction NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN t.category_slug = 'legal_services' THEN 'Legal Services'
            WHEN t.category_slug = 'accounting_services' THEN 'Accounting Services'
            WHEN t.category_slug = 'consulting_services' THEN 'Consulting Services'
            ELSE 'Other Professional Services'
        END AS service_type,
        ABS(SUM(t.amount)) AS total_expense,
        COUNT(*) AS transaction_count,
        ABS(SUM(t.amount)) / NULLIF(COUNT(*), 0) AS avg_expense_per_transaction
    FROM
        transactions t
    WHERE
        t.team_id = get_professional_services_analysis.team_id
        AND t.date BETWEEN start_date AND end_date
        AND t.currency = get_professional_services_analysis.currency
        AND t.amount < 0
        AND t.category_slug IN ('legal_services', 'accounting_services', 'consulting_services', 'professional_services')
    GROUP BY
        CASE
            WHEN t.category_slug = 'legal_services' THEN 'Legal Services'
            WHEN t.category_slug = 'accounting_services' THEN 'Accounting Services'
            WHEN t.category_slug = 'consulting_services' THEN 'Consulting Services'
            ELSE 'Other Professional Services'
        END
    ORDER BY
        total_expense DESC;
END;
$$;

-- 22. Function to analyze software subscription expenses
CREATE OR REPLACE FUNCTION public.get_software_subscription_analysis(
    team_id UUID,
    start_date DATE,
    end_date DATE,
    currency TEXT
)
RETURNS TABLE (
    software_name TEXT,
    total_expense NUMERIC,
    subscription_count BIGINT,
    avg_monthly_cost NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH monthly_subscriptions AS (
        SELECT
            t.merchant_name AS software_name,
            DATE_TRUNC('month', t.date) AS subscription_month,
            ABS(SUM(t.amount)) AS monthly_cost
        FROM
            transactions t
        WHERE
            t.team_id = get_software_subscription_analysis.team_id
            AND t.date BETWEEN start_date AND end_date
            AND t.currency = get_software_subscription_analysis.currency
            AND t.amount < 0
            AND t.category_slug = 'software_subscription'
        GROUP BY
            t.merchant_name, DATE_TRUNC('month', t.date)
    )
    SELECT
        ms.software_name,
        SUM(ms.monthly_cost) AS total_expense,
        COUNT(DISTINCT ms.subscription_month) AS subscription_count,
        AVG(ms.monthly_cost) AS avg_monthly_cost
    FROM
        monthly_subscriptions ms
    GROUP BY
        ms.software_name
    ORDER BY
        total_expense DESC;
END;
$$;
-- 23. Function to analyze supplier expenses
CREATE OR REPLACE FUNCTION public.get_supplier_expense_analysis(
    team_id UUID,
    start_date DATE,
    end_date DATE,
    currency TEXT
)
RETURNS TABLE (
    supplier_name TEXT,
    total_expense NUMERIC,
    transaction_count BIGINT,
    avg_expense_per_transaction NUMERIC,
    last_transaction_date DATE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.merchant_name AS supplier_name,
        ABS(SUM(t.amount)) AS total_expense,
        COUNT(*) AS transaction_count,
        ABS(SUM(t.amount)) / NULLIF(COUNT(*), 0) AS avg_expense_per_transaction,
        MAX(t.date) AS last_transaction_date
    FROM
        transactions t
    WHERE
        t.team_id = get_supplier_expense_analysis.team_id
        AND t.date BETWEEN start_date AND end_date
        AND t.currency = get_supplier_expense_analysis.currency
        AND t.amount < 0
        AND t.category_slug IN ('supplies', 'materials', 'inventory')
    GROUP BY
        t.merchant_name
    ORDER BY
        total_expense DESC;
END;
$$;

-- 24. Function to analyze shipping and logistics expenses
CREATE OR REPLACE FUNCTION public.get_shipping_logistics_analysis(
    team_id UUID,
    start_date DATE,
    end_date DATE,
    currency TEXT
)
RETURNS TABLE (
    expense_type TEXT,
    total_expense NUMERIC,
    transaction_count BIGINT,
    avg_expense_per_transaction NUMERIC,
    percentage_of_total NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    total_shipping_expense NUMERIC;
BEGIN
    -- Calculate total shipping and logistics expense
    SELECT ABS(SUM(amount))
    INTO total_shipping_expense
    FROM transactions
    WHERE team_id = get_shipping_logistics_analysis.team_id
        AND date BETWEEN start_date AND end_date
        AND currency = get_shipping_logistics_analysis.currency
        AND amount < 0
        AND category_slug IN ('shipping', 'logistics', 'freight');

    RETURN QUERY
    SELECT
        CASE
            WHEN t.category_slug = 'shipping' THEN 'Shipping'
            WHEN t.category_slug = 'logistics' THEN 'Logistics'
            WHEN t.category_slug = 'freight' THEN 'Freight'
            ELSE 'Other Shipping Expenses'
        END AS expense_type,
        ABS(SUM(t.amount)) AS total_expense,
        COUNT(*) AS transaction_count,
        ABS(SUM(t.amount)) / NULLIF(COUNT(*), 0) AS avg_expense_per_transaction,
        CASE
            WHEN total_shipping_expense = 0 THEN 0
            ELSE (ABS(SUM(t.amount)) / total_shipping_expense) * 100
        END AS percentage_of_total
    FROM
        transactions t
    WHERE
        t.team_id = get_shipping_logistics_analysis.team_id
        AND t.date BETWEEN start_date AND end_date
        AND t.currency = get_shipping_logistics_analysis.currency
        AND t.amount < 0
        AND t.category_slug IN ('shipping', 'logistics', 'freight')
    GROUP BY
        CASE
            WHEN t.category_slug = 'shipping' THEN 'Shipping'
            WHEN t.category_slug = 'logistics' THEN 'Logistics'
            WHEN t.category_slug = 'freight' THEN 'Freight'
            ELSE 'Other Shipping Expenses'
        END
    ORDER BY
        total_expense DESC;
END;
$$;

-- Grant necessary permissions for all functions
GRANT EXECUTE ON FUNCTION public.get_monthly_expenses(UUID, DATE, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_expenses_by_category(UUID, DATE, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_expenses(UUID, DATE, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_expense_categories(UUID, DATE, DATE, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_expense_growth_rate(UUID, DATE, DATE, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_expense_forecast(UUID, DATE, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_expense_comparison(UUID, DATE, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_expenses_by_merchant(UUID, DATE, DATE, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_expense_trends(UUID, DATE, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_expenses_by_payment_channel(UUID, DATE, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recurring_expenses(UUID, DATE, DATE, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_expense_distribution_by_day_of_week(UUID, DATE, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_expense_trends_by_time_of_day(UUID, DATE, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_expense_anomalies(UUID, DATE, DATE, TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_expense_breakdown_by_location(UUID, DATE, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_expense_by_personal_finance_category(UUID, DATE, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_rent_and_utilities_analysis(UUID, DATE, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_salaries_and_wages_analysis(UUID, DATE, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_equipment_and_maintenance_analysis(UUID, DATE, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_inventory_cost_analysis(UUID, DATE, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_professional_services_analysis(UUID, DATE, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_software_subscription_analysis(UUID, DATE, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_supplier_expense_analysis(UUID, DATE, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_shipping_logistics_analysis(UUID, DATE, DATE, TEXT) TO authenticated;