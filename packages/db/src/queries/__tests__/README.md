# Matching Algorithm Test Suite

This comprehensive test suite ensures the reliability and performance of the AI-powered inbox matching algorithm. It provides confidence in algorithm changes and catches regressions before they reach production.

## Test Structure

### 📁 Test Files

- **`transaction-matching.test.ts`** - Core unit tests for matching functions
- **`golden-regression.test.ts`** - Regression tests using golden dataset
- **`test-setup.ts`** - Shared test utilities and mock data
- **`golden-dataset.ts`** - Known good/bad matches for regression testing
- **`run-tests.ts`** - Test runner with reporting

### 🏗️ Test Architecture

```
┌─ Unit Tests ─────────────────────────────────┐
│ • Core matching functions                    │
│ • Confidence scoring                         │
│ • Team calibration                           │
│ • Edge cases                                 │
└──────────────────────────────────────────────┘

┌─ Golden Dataset Tests ───────────────────────┐
│ • Known good matches (should always work)    │
│ • Known bad matches (should always fail)     │
│ • Edge cases with expected behavior          │
│ • Performance benchmarks                     │
└──────────────────────────────────────────────┘

┌─ Integration Tests ──────────────────────────┐
│ • End-to-end matching flow                   │
│ • Job orchestration                          │
│ • Error handling                             │
│ • Performance under load                     │
└──────────────────────────────────────────────┘
```

## 🚀 Running Tests

### Quick Start

```bash
# Run all tests
cd packages/db
bun test

# Run specific test suites
bun run test:unit        # Unit tests only
bun run test:golden      # Golden dataset regression tests
bun run test:runner      # Full test suite with reporting

# Watch mode for development
bun run test:watch
```

### Advanced Usage

```bash
# Run tests with coverage
bun run test:coverage

# Run integration tests (from jobs package)
cd packages/jobs
bun run test:integration

# Run performance benchmarks only
bun test src/queries/__tests__/golden-regression.test.ts --grep "Performance"
```

## 📊 Golden Dataset

The golden dataset contains carefully curated test cases that represent real-world matching scenarios:

### ✅ Known Good Matches
- **Perfect Match**: Same merchant, exact amount, same currency
- **Cross-Currency**: Different currencies, exact base amounts  
- **Semantic Match**: Different names, same company
- **Date Tolerance**: Good match with slight date difference
- **Subscription**: Recurring payments

### ❌ Known Bad Matches
- **Different Merchants**: Completely unrelated transactions
- **Amount Mismatch**: Same merchant, very different amounts
- **Date Mismatch**: Same merchant, very different dates

### ⚠️ Edge Cases
- **Missing Data**: Null amounts, missing currencies
- **Zero Amounts**: Edge case handling
- **Extreme Values**: Very large amounts, very old dates

## 🎯 What Tests Catch

### Algorithm Regressions
- Changes that break previously working matches
- Confidence score drift over time
- Performance degradation

### Configuration Issues  
- Threshold changes affecting match quality
- Weight adjustments breaking calibration
- Database schema changes

### Integration Problems
- Job orchestration failures
- Error handling gaps
- Performance bottlenecks

## 📈 Performance Benchmarks

The test suite includes performance benchmarks to ensure the algorithm scales:

- **Single Match**: < 100ms per match
- **Batch Processing**: < 1s for 10 concurrent matches  
- **Calibration Update**: < 200ms to recalculate thresholds

## 🔧 Test Configuration

### Mock Database
Tests use Drizzle's official mock driver for consistent, fast testing:

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@db/schema";

const mockDb = drizzle.mock({ schema });
```

### Test Data
Realistic test data is generated with:
- Deterministic embeddings based on content
- Realistic merchant variations
- Currency conversion scenarios
- Date patterns reflecting real usage

## 📝 Adding New Tests

### For Algorithm Changes

1. **Add to Golden Dataset**: Create new test cases in `golden-dataset.ts`
2. **Update Expectations**: Adjust confidence thresholds if needed
3. **Add Edge Cases**: Test boundary conditions
4. **Performance Test**: Ensure changes don't slow down matching

### For New Features

1. **Unit Tests**: Test individual functions in isolation
2. **Integration Tests**: Test feature in full matching flow  
3. **Golden Cases**: Add representative examples
4. **Documentation**: Update this README

## 🚨 When Tests Fail

### Regression Test Failures
- **Investigate**: Why did a known good match start failing?
- **Root Cause**: Algorithm change? Data change? Bug?
- **Decision**: Fix the algorithm or update the golden dataset
- **Document**: Record the decision and reasoning

### Performance Test Failures
- **Profile**: Use performance tools to identify bottlenecks
- **Optimize**: Improve algorithm efficiency
- **Scale Test**: Verify fixes work under load

### Integration Test Failures
- **Check Dependencies**: Are external services working?
- **Verify Data**: Is test data still valid?
- **Debug Flow**: Step through the matching pipeline

## 📊 Test Reports

The test runner generates detailed reports including:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "overallStatus": "PASS",
  "results": [
    {
      "type": "Unit Tests",
      "passed": 25,
      "failed": 0,
      "duration": 150
    }
  ],
  "summary": {
    "totalTests": 45,
    "totalPassed": 45,
    "totalFailed": 0,
    "totalDuration": 500
  }
}
```

## 🎯 Best Practices

### Test Maintenance
- **Regular Updates**: Keep golden dataset current with real data
- **Performance Monitoring**: Track test execution times
- **Coverage Tracking**: Ensure new code is tested

### Development Workflow
- **TDD**: Write tests before changing algorithm
- **Continuous Testing**: Run tests in watch mode during development
- **Pre-commit**: Always run full test suite before committing

### Algorithm Changes
- **Backward Compatibility**: Ensure changes don't break existing matches
- **Gradual Rollout**: Test changes with subset of data first
- **Monitoring**: Watch production metrics after algorithm updates

## 🔗 Related Documentation

- [Inbox Matching System Overview](../../../apps/docs/inbox-matching.mdx)
- [Algorithm Implementation](../transaction-matching.ts)
- [Job Orchestration](../../jobs/src/tasks/inbox/)
- [Performance Monitoring](../../../packages/logger/)

---

*This test suite is designed to give you confidence in the matching algorithm. When in doubt, add more tests! 🧪*
