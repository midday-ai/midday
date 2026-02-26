import { Document, Font, Page } from "@react-pdf/renderer";
import type {
  DisclosureFigures,
  DisclosurePartyInfo,
  StateDisclosureConfig,
} from "../../types";
import { AuditFooter } from "./components/audit-footer";
import { CalculationTable } from "./components/calculation-table";
import { DealSummary } from "./components/deal-summary";
import { Header } from "./components/header";
import { LegalText } from "./components/legal-text";
import { SignatureBlock } from "./components/signature-block";

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fMZhrib2Bg-4.ttf",
      fontWeight: 500,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf",
      fontWeight: 600,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf",
      fontWeight: 700,
    },
  ],
});

type DisclosurePdfTemplateOptions = {
  documentHash?: string;
};

export async function DisclosurePdfTemplate(
  figures: DisclosureFigures,
  stateConfig: StateDisclosureConfig,
  partyInfo: DisclosurePartyInfo,
  options?: DisclosurePdfTemplateOptions,
) {
  return (
    <Document>
      <Page
        wrap
        size="LETTER"
        style={{
          padding: 40,
          backgroundColor: "#fff",
          color: "#000",
          fontFamily: "Inter",
          fontWeight: 400,
          fontSize: 9,
        }}
      >
        <Header
          stateConfig={stateConfig}
          generatedDate={figures.calculatedAt.split("T")[0] ?? figures.calculatedAt}
        />

        <DealSummary partyInfo={partyInfo} />

        <CalculationTable figures={figures} stateConfig={stateConfig} />

        <LegalText stateConfig={stateConfig} />

        <SignatureBlock />

        <AuditFooter
          templateVersion={stateConfig.version}
          generatedAt={figures.calculatedAt}
          documentHash={options?.documentHash}
          calculationVersion={figures.calculationVersion}
        />
      </Page>
    </Document>
  );
}
