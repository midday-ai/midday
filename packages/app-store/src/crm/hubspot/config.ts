import { IntegrationCategory, IntegrationConfig } from '../../types';
import { Logo } from './assets/logo';

const hubspotApp: IntegrationConfig = {
  name: 'HubSpot',
  id: 'hubspot',
  category: IntegrationCategory.CRM,
  active: false,
  logo: Logo,
  short_description: 'Inbound marketing and sales platform',
  description: 'HubSpot is a comprehensive inbound marketing, sales, and customer service platform that helps businesses grow.',
  images: [],
  onInitialize: () => {
    // Initialization logic
  },
  settings: [],
  config: {},
};

export default hubspotApp;