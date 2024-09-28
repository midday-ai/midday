import { IntegrationCategory, IntegrationConfig } from '../../types';
import { Logo } from './assets/logo';

const sugarCrmApp: IntegrationConfig = {
  name: 'Sugar CRM',
  id: 'sugar-crm',
  category: IntegrationCategory.CRM,
  active: false,
  logo: Logo,
  short_description: 'CRM for customer experience management',
  description: 'Sugar CRM is a comprehensive customer experience management platform that helps organizations create customers for life.',
  images: [],
  onInitialize: () => {
    // Initialization logic
  },
  settings: [],
  config: {},
};

export default sugarCrmApp;