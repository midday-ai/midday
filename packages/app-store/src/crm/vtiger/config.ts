import { IntegrationCategory, IntegrationConfig } from '../../types';
import { Logo } from './assets/logo';

const vtigerApp: IntegrationConfig = {
  name: 'Vtiger',
  id: 'vtiger',
  category: IntegrationCategory.CRM,
  active: false,
  logo: Logo,
  short_description: 'All-in-one CRM',
  description: 'Vtiger is an all-in-one CRM that helps businesses automate sales, marketing, and customer support processes.',
  images: [],
  onInitialize: () => {
    // Initialization logic
  },
  settings: [],
  config: {},
};

export default vtigerApp;