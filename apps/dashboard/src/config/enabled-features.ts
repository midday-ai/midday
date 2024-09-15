import { featureFlags } from "@internal/env/dashboard";

const features = {
    isAnalyticsV2Enabled: featureFlags.isAnalyticsV2Enabled,
}

export default features;