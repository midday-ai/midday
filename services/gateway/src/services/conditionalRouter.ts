import { StrategyModes, Targets } from '../types/requestBody';

type Query = {
  [key: string]: any;
};

interface RouterContext {
  metadata?: Record<string, string>;
}

enum Operator {
  // Comparison Operators
  Equal = '$eq',
  NotEqual = '$ne',
  GreaterThan = '$gt',
  GreaterThanOrEqual = '$gte',
  LessThan = '$lt',
  LessThanOrEqual = '$lte',
  In = '$in',
  NotIn = '$nin',
  Regex = '$regex',

  // Logical Operators
  And = '$and',
  Or = '$or',
}

export class ConditionalRouter {
  private config: Targets;
  private context: RouterContext;

  constructor(config: Targets, context: RouterContext) {
    this.config = config;
    this.context = context;
    if (this.config.strategy?.mode !== StrategyModes.CONDITIONAL) {
      throw new Error('Unsupported strategy mode');
    }
  }

  resolveTarget(): Targets {
    if (!this.config.strategy?.conditions) {
      throw new Error('No conditions passed in the query router');
    }

    for (const condition of this.config.strategy.conditions) {
      if (this.evaluateQuery(condition.query)) {
        const targetName = condition.then;
        return this.findTarget(targetName);
      }
    }

    // If no conditions matched and a default is specified, return the default target
    if (this.config.strategy.default) {
      return this.findTarget(this.config.strategy.default);
    }

    throw new Error('Query router did not resolve to any valid target');
  }

  private evaluateQuery(query: Query): boolean {
    for (const [key, value] of Object.entries(query)) {
      if (key === Operator.Or && Array.isArray(value)) {
        return value.some((subCondition: Query) =>
          this.evaluateQuery(subCondition)
        );
      }

      if (key === Operator.And && Array.isArray(value)) {
        return value.every((subCondition: Query) =>
          this.evaluateQuery(subCondition)
        );
      }

      const metadataValue = this.getContextValue(key);

      if (typeof value === 'object' && value !== null) {
        if (!this.evaluateOperator(value, metadataValue)) {
          return false;
        }
      } else if (metadataValue !== value) {
        return false;
      }
    }

    return true;
  }

  private evaluateOperator(operator: string, value: any): boolean {
    for (const [op, compareValue] of Object.entries(operator)) {
      switch (op) {
        case Operator.Equal:
          if (value !== compareValue) return false;
          break;
        case Operator.NotEqual:
          if (value === compareValue) return false;
          break;
        case Operator.GreaterThan:
          if (!(parseFloat(value) > parseFloat(compareValue))) return false;
          break;
        case Operator.GreaterThanOrEqual:
          if (!(parseFloat(value) >= parseFloat(compareValue))) return false;
          break;
        case Operator.LessThan:
          if (!(parseFloat(value) < parseFloat(compareValue))) return false;
          break;
        case Operator.LessThanOrEqual:
          if (!(parseFloat(value) <= parseFloat(compareValue))) return false;
          break;
        case Operator.In:
          if (!Array.isArray(compareValue) || !compareValue.includes(value))
            return false;
          break;
        case Operator.NotIn:
          if (!Array.isArray(compareValue) || compareValue.includes(value))
            return false;
          break;
        case Operator.Regex:
          try {
            const regex = new RegExp(compareValue);
            return regex.test(value);
          } catch (e) {
            return false;
          }
        default:
          throw new Error(
            `Unsupported operator used in the query router: ${op}`
          );
      }
    }
    return true;
  }

  private findTarget(name: string): Targets {
    const index =
      this.config.targets?.findIndex((target) => target.name === name) ?? -1;
    if (index === -1) {
      throw new Error(`Invalid target name found in the query router: ${name}`);
    }

    return {
      ...this.config.targets?.[index],
      index,
    };
  }

  private getContextValue(key: string): any {
    const parts = key.split('.');
    let value: any = this.context;
    value = value[parts[0]]?.[parts[1]];
    return value;
  }
}
