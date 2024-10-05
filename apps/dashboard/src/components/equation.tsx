import { EquationConfig } from "@midday/app-store/types";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import React, { useState } from "react";

interface EquationProps {
  config: EquationConfig;
}

export function Equation({ config }: EquationProps) {
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});
  const [result, setResult] = useState<{ [key: string]: number } | null>(null);

  const handleInputChange = (key: string, value: string) => {
    setInputValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleCalculate = () => {
    const numericInputs: { [key: string]: number } = {};
    for (const [key, value] of Object.entries(inputValues)) {
      numericInputs[key] = parseFloat(value);
    }
    const calculationResult = config.calculate(numericInputs);
    setResult(calculationResult);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      <h2 className="md:text-3xl font-bold leading-8 py-[2.5%] text-foreground font-mono">
        {config.formula}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(config.variables).map(([key, variable]) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{variable.label}</Label>
            <div className="flex items-center space-x-2">
              <Input
                id={key}
                type="number"
                value={inputValues[key] || ""}
                onChange={(e) => handleInputChange(key, e.target.value)}
                placeholder={variable.description}
              />
              {variable.unit && (
                <span className="text-sm text-gray-500">{variable.unit}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <Button onClick={handleCalculate}>Calculate</Button>
      {result && (
        <div className="mt-4 bg-gray-100 p-4 rounded-md">
          <h3 className="text-md font-semibold mb-2">Result:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(result).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="font-medium">
                  {config.variables[key]?.label}:
                </span>
                <span>
                  {formatNumber(value)}
                  {config.variables[key]?.unit &&
                    ` ${config.variables[key].unit}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
