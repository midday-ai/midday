"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { cn } from "@midday/ui/cn";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

type Preset = "conservative" | "balanced" | "lenient" | "custom";

const presetDescriptions = {
  conservative:
    "Flags risk early, slow to forgive. Best for cautious operators.",
  balanced: "Default settings. Matches most operators\u2019 intuition.",
  lenient: "Patient approach, focuses on trends. Tolerates hiccups.",
} as const;

const factorLabels: Record<string, { label: string; hint: string }> = {
  consistency: {
    label: "Payment Consistency",
    hint: "How reliably payments arrive on time",
  },
  nsf: {
    label: "NSF Severity",
    hint: "Impact of bounced/returned payments",
  },
  velocity: {
    label: "Payment Velocity",
    hint: "Pace of repayment vs. expected schedule",
  },
  recovery: {
    label: "Recovery Behavior",
    hint: "How quickly merchant catches up after misses",
  },
  progress: {
    label: "Deal Progress",
    hint: "Percentage paid vs. percentage of term elapsed",
  },
  amounts: {
    label: "Amount Accuracy",
    hint: "Whether payment amounts match expectations",
  },
};

type Weights = {
  consistency: number;
  nsf: number;
  velocity: number;
  recovery: number;
  progress: number;
  amounts: number;
};

export function RiskConfigForm() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery(
    trpc.risk.getConfig.queryOptions(),
  );

  const { data: distribution } = useQuery(
    trpc.risk.getDistribution.queryOptions(),
  );

  const saveMutation = useMutation(
    trpc.risk.saveConfig.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.risk.getConfig.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.risk.getDistribution.queryKey(),
        });
      },
    }),
  );

  const [activeTab, setActiveTab] = useState<
    "presets" | "weights" | "advanced"
  >("presets");
  const [preset, setPreset] = useState<Preset>("balanced");
  const [weights, setWeights] = useState<Weights>({
    consistency: 0.25,
    nsf: 0.25,
    velocity: 0.15,
    recovery: 0.15,
    progress: 0.1,
    amounts: 0.1,
  });
  const [decayDays, setDecayDays] = useState(30);
  const [baselineScore, setBaselineScore] = useState(50);
  const [bandLowMax, setBandLowMax] = useState(33);
  const [bandHighMin, setBandHighMin] = useState(67);

  useEffect(() => {
    if (config) {
      setPreset(config.preset as Preset);
      if (config.weights) setWeights(config.weights as Weights);
      setDecayDays(config.decayHalfLifeDays);
      setBaselineScore(config.baselineScore);
      if (config.bandThresholds) {
        const bt = config.bandThresholds as {
          low_max: number;
          high_min: number;
        };
        setBandLowMax(bt.low_max);
        setBandHighMin(bt.high_min);
      }
    }
  }, [config]);

  function handlePresetSelect(p: Preset) {
    setPreset(p);
  }

  function handleSave() {
    if (preset !== "custom") {
      saveMutation.mutate({ preset });
    } else {
      saveMutation.mutate({
        preset: "custom",
        weights,
        decayHalfLifeDays: decayDays,
        baselineScore,
        bandThresholds: { low_max: bandLowMax, high_min: bandHighMin },
      });
    }
  }

  function handleWeightChange(key: string, newVal: number) {
    const typedKey = key as keyof Weights;
    const oldVal = weights[typedKey];
    const diff = newVal - oldVal;
    const otherKeys = (Object.keys(weights) as Array<keyof Weights>).filter(
      (k) => k !== typedKey,
    );
    const otherSum = otherKeys.reduce((sum, k) => sum + weights[k], 0);

    const updated = { ...weights, [typedKey]: newVal };

    if (otherSum > 0) {
      for (const k of otherKeys) {
        const proportion = weights[k] / otherSum;
        updated[k] = Math.max(0, weights[k] - diff * proportion);
      }
    }

    const total = Object.values(updated).reduce((a, b) => a + b, 0);
    for (const k of Object.keys(updated) as Array<keyof Weights>) {
      updated[k] = Math.round((updated[k] / total) * 100) / 100;
    }

    setWeights(updated);
    setPreset("custom");
  }

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-muted rounded" />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-medium">Risk Configuration</h2>
        <p className="text-[12px] text-[#606060] mt-1">
          Configure how risk scores are calculated for your portfolio.
        </p>
      </div>

      {/* Distribution Preview */}
      {distribution && distribution.total > 0 && (
        <div className="flex items-center gap-4 text-[12px]">
          <span className="text-[#878787]">Current portfolio:</span>
          <span className="text-emerald-600 font-medium">
            {distribution.low} low
          </span>
          <span className="text-[#878787]">&middot;</span>
          <span className="text-amber-600 font-medium">
            {distribution.medium} medium
          </span>
          <span className="text-[#878787]">&middot;</span>
          <span className="text-red-600 font-medium">
            {distribution.high} high
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["presets", "weights", "advanced"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-[#878787] hover:text-primary",
            )}
          >
            {tab === "presets"
              ? "Presets"
              : tab === "weights"
                ? "Weights"
                : "Advanced"}
          </button>
        ))}
      </div>

      {/* Presets Tab */}
      {activeTab === "presets" && (
        <div className="space-y-3">
          {(
            Object.keys(presetDescriptions) as Array<
              keyof typeof presetDescriptions
            >
          ).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handlePresetSelect(p)}
              className={cn(
                "w-full text-left border p-4 transition-colors",
                preset === p
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
              )}
            >
              <div className="font-medium text-sm capitalize">{p}</div>
              <div className="text-[12px] text-[#606060] mt-1">
                {presetDescriptions[p]}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Weights Tab */}
      {activeTab === "weights" && (
        <div className="space-y-4">
          {Object.entries(factorLabels).map(([key, { label, hint }]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <label className="text-xs text-[#878787] font-normal">
                    {label}
                  </label>
                  <p className="text-[11px] text-[#606060]">{hint}</p>
                </div>
                <span className="text-xs font-medium tabular-nums">
                  {Math.round(weights[key as keyof Weights] * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={0.6}
                step={0.01}
                value={weights[key as keyof Weights]}
                onChange={(e) =>
                  handleWeightChange(key, Number.parseFloat(e.target.value))
                }
                className="w-full accent-primary"
              />
            </div>
          ))}
        </div>
      )}

      {/* Advanced Tab */}
      {activeTab === "advanced" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label className="text-xs text-[#878787]">
              Decay Half-Life (days)
            </label>
            <p className="text-[11px] text-[#606060] mb-1.5">
              How many days until an event loses half its impact
            </p>
            <Input
              type="number"
              value={decayDays}
              onChange={(e) => {
                setDecayDays(Number(e.target.value));
                setPreset("custom");
              }}
              min={5}
              max={120}
            />
          </div>
          <div>
            <label className="text-xs text-[#878787]">Baseline Score</label>
            <p className="text-[11px] text-[#606060] mb-1.5">
              Starting score for new deals with no history
            </p>
            <Input
              type="number"
              value={baselineScore}
              onChange={(e) => {
                setBaselineScore(Number(e.target.value));
                setPreset("custom");
              }}
              min={0}
              max={100}
            />
          </div>
          <div>
            <label className="text-xs text-[#878787]">Low Risk Max</label>
            <p className="text-[11px] text-[#606060] mb-1.5">
              Scores at or below this are Low risk
            </p>
            <Input
              type="number"
              value={bandLowMax}
              onChange={(e) => {
                setBandLowMax(Number(e.target.value));
                setPreset("custom");
              }}
              min={0}
              max={100}
            />
          </div>
          <div>
            <label className="text-xs text-[#878787]">High Risk Min</label>
            <p className="text-[11px] text-[#606060] mb-1.5">
              Scores at or above this are High risk
            </p>
            <Input
              type="number"
              value={bandHighMin}
              onChange={(e) => {
                setBandHighMin(Number(e.target.value));
                setPreset("custom");
              }}
              min={0}
              max={100}
            />
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="text-[12px] text-[#878787]">
          {preset !== "custom"
            ? `Using "${preset}" preset`
            : "Custom configuration"}
        </div>
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          size="sm"
        >
          {saveMutation.isPending
            ? "Saving & Recalculating..."
            : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
}
