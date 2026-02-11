# Documentation

This directory contains technical documentation for the Midday.

## Contents

- **[weekly-insights.md](./weekly-insights.md)** - Technical documentation of the AI-powered weekly insights system including content generation, metric selection, data consistency, and advanced projections (runway dates, quarter pace, payment anomalies).
- **[inbox-matching.md](./inbox-matching.md)** - Detailed documentation of the AI-powered inbox matching algorithm that automatically matches receipts and invoices with bank transactions.
- **[invoice-recurring.md](./invoice-recurring.md)** - Technical documentation of the recurring invoice system including architecture, state machine, generation flow, and key design decisions.
- **[document-processing.md](./document-processing.md)** - Technical documentation of the document processing pipeline including AI classification, graceful degradation, retry functionality, and error handling.
- **[database-connection-pooling.md](./database-connection-pooling.md)** - Database connection pooling setup with Supabase Supavisor (transaction mode), multi-region read replica mapping across Railway, pool configuration, and prepared statement constraints.

## About

This documentation provides in-depth technical details about core Midday features and algorithms. It's intended for developers working on the codebase who need to understand the implementation details, data flows, and architectural decisions.

The documentation here is kept in sync with the actual implementation and provides more technical depth than the user-facing documentation in the apps/docs directory.
