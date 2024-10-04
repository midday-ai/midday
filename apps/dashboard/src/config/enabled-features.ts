import { featureFlags } from "@internal/env/dashboard";
import { is } from "date-fns/locale";

const features = {
  isAnalyticsV2Enabled: featureFlags.isAnalyticsV2Enabled,
  isPaymentsEnabled: featureFlags.isPaymentsEnabled,
  isBackendEnabled: featureFlags.isSolomonBackendInteractionsEnabled,
};

export default features;
