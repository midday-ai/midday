"use client";

import { useCallback, useRef, useState } from "react";
import { AnalysisResultsCard } from "./analysis-results-card";
import { BuyBoxCard } from "./buy-box-card";
import type { AnalysisResult, BuyBoxCriteria } from "./mock-analysis";
import { generateMockAnalysis } from "./mock-analysis";
import { StatementUploadCard } from "./statement-upload-card";

const ANALYSIS_STEPS = [
  "Extracting transaction data...",
  "Calculating revenue metrics...",
  "Detecting NSF patterns...",
  "Evaluating against buy box...",
];

export function UnderwritingContent() {
  const [files, setFiles] = useState<File[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState("");
  const criteriaRef = useRef<BuyBoxCriteria>({});

  const handleCriteriaChange = useCallback((criteria: BuyBoxCriteria) => {
    criteriaRef.current = criteria;
  }, []);

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    // Simulate analysis with step-by-step progress
    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      setAnalysisStep(ANALYSIS_STEPS[i]!);
      await new Promise((resolve) =>
        setTimeout(resolve, 500 + Math.random() * 400),
      );
    }

    const result = generateMockAnalysis(criteriaRef.current, files.length);
    setAnalysisResult(result);
    setIsAnalyzing(false);
    setAnalysisStep("");
  }, [files.length]);

  return (
    <div className="flex flex-col gap-6 py-6 px-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-medium">Underwriting</h1>
        <p className="text-sm text-muted-foreground">
          Define your buy box criteria and analyze merchant bank statements
        </p>
      </div>

      {/* Buy Box Configuration */}
      <BuyBoxCard onCriteriaChange={handleCriteriaChange} />

      {/* Bank Statement Upload */}
      <StatementUploadCard
        files={files}
        onFilesChange={setFiles}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
      />

      {/* Analysis Loading State */}
      {isAnalyzing && (
        <div className="border border-border/40 shadow-sm rounded-lg p-8 flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Analyzing bank statements...</p>
          <p className="text-xs text-muted-foreground">{analysisStep}</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && !isAnalyzing && (
        <AnalysisResultsCard result={analysisResult} />
      )}
    </div>
  );
}
