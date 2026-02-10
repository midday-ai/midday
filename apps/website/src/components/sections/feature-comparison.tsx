"use client";

import { Fragment } from "react";
import type { Competitor } from "@/data/competitors";

interface Props {
  competitor: Competitor;
}

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <span className="text-foreground">Yes</span>
    ) : (
      <span className="text-muted-foreground">No</span>
    );
  }
  return <span className="text-foreground">{value}</span>;
}

export function FeatureComparison({ competitor }: Props) {
  return (
    <div>
      <h2 className="font-serif text-2xl text-foreground mb-4 text-center">
        Feature comparison
      </h2>
      <p className="font-sans text-base text-muted-foreground mb-8 text-center max-w-2xl mx-auto">
        See how Midday compares to {competitor.name} across key features.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="text-left font-sans font-normal text-sm text-muted-foreground py-4 pl-4 pr-4 w-1/2">
                Feature
              </th>
              <th className="text-center font-sans font-normal text-sm text-foreground py-4 px-4 w-1/4">
                Midday
              </th>
              <th className="text-center font-sans font-normal text-sm text-muted-foreground py-4 pl-4 w-1/4">
                {competitor.name}
              </th>
            </tr>
          </thead>
          <tbody>
            {competitor.features.map((category) => (
              <Fragment key={category.category}>
                {category.features.map((feature) => (
                  <tr
                    key={feature.name}
                    className="border-b border-border hover:bg-muted/20 transition-colors"
                  >
                    <td className="font-sans text-sm text-foreground py-3 pl-4 pr-4">
                      {feature.name}
                    </td>
                    <td className="text-center font-sans text-sm py-3 px-4">
                      <FeatureValue value={feature.midday} />
                    </td>
                    <td className="text-center font-sans text-sm py-3 pl-4">
                      <FeatureValue value={feature.competitor} />
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
