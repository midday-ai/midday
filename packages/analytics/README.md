# Financial Analysis Module

This module provides a robust set of tools for analyzing financial transactions, specifically tailored for Plaid account data. It offers insights into Annual Recurring Revenue (ARR), revenue breakdowns, and top-performing segments.

## Table of Contents

1. [Installation](#installation)
2. [Usage](#usage)
3. [API Reference](#api-reference)
4. [Development](#development)
5. [License](#license)

## Installation

To use this module in your project, install it via npm:

```bash
npm install @your-org/financial-analysis
```

## Usage

Here's a basic example of how to use the `FinancialAnalysis` class:

```typescript
import { FinancialAnalysis } from '@your-org/financial-analysis';
import { PlaidAccountTransaction } from 'client-typescript-sdk';

// Initialize with an array of PlaidAccountTransaction objects
const transactions: PlaidAccountTransaction[] = [...];
const analysis = new FinancialAnalysis(transactions);

// Example usage
const monthlyARR = analysis.getMonthlyARR();
const topSegments = analysis.getTopRevenueSegments(5);

console.log('Monthly ARR:', monthlyARR);
console.log('Top 5 Revenue Segments:', topSegments);
```

## API Reference

### Constructor

- `constructor(transactions: PlaidAccountTransaction[])`

### Public Methods

- `getMonthlyARR(): number`
  - Calculates the Monthly Annual Recurring Revenue.

- `getYearlyARR(): number`
  - Calculates the Yearly Annual Recurring Revenue.

- `getIncomeGrowthRate(startDate: Date, endDate: Date): number`
  - Calculates the income growth rate between two dates.

- `getARRBreakdownBySegment(): Record<string, number>`
  - Provides a breakdown of ARR by business segment.

- `getARRBreakdownByPaymentChannel(): Record<string, number>`
  - Provides a breakdown of ARR by payment channel.

- `getARRBreakdownByTransactionType(): Record<string, number>`
  - Provides a breakdown of ARR by transaction type.

- `getTopRevenueTransactions(limit: number): PlaidAccountTransaction[]`
  - Returns the top revenue-generating transactions.

- `getTopRevenueSegments(limit: number): Record<string, number>`
  - Returns the top revenue-generating business segments.

- `getTopRevenuePaymentChannels(limit: number): Record<string, number>`
  - Returns the top revenue-generating payment channels.

- `getTopRevenueTransactionTypes(limit: number): Record<string, number>`
  - Returns the top revenue-generating transaction types.

## Development

This project is developed using TypeScript. To set up the development environment:

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/financial-analysis.git
   cd financial-analysis
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. To compile the TypeScript files:
   ```bash
   npm run build
   ```

4. To run tests:
   ```bash
   npm test
   ```

### TypeScript Configuration

The project uses a `tsconfig.json` file for TypeScript configuration. Key settings include:

- Strict type checking
- ES6 module system
- Targeting ES2018

For full details, refer to the `tsconfig.json` file in the project root.

## License

[Add your license information here]

## Contributing

We welcome contributions to improve the Financial Analysis module. Please read our [CONTRIBUTING.md](CONTRIBUTING.md) file for details on our code of conduct and the process for submitting pull requests.

## Support

If you encounter any issues or have questions, please file an issue on the GitHub issue tracker.