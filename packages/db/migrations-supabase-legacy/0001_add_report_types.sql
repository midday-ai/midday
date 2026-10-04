-- Add new report types to the reportTypes enum
ALTER TYPE "reportTypes" ADD VALUE IF NOT EXISTS 'monthly_revenue';
ALTER TYPE "reportTypes" ADD VALUE IF NOT EXISTS 'revenue_forecast';
ALTER TYPE "reportTypes" ADD VALUE IF NOT EXISTS 'runway';
ALTER TYPE "reportTypes" ADD VALUE IF NOT EXISTS 'category_expenses';

