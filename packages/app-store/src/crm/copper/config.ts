import { IntegrationCategory, IntegrationConfig } from '../../types';
import { Logo } from './assets/logo';

const copperApp: IntegrationConfig = {
  name: 'Copper',
  id: 'copper',
  category: IntegrationCategory.CRM,
  active: false,
  logo: Logo,
  short_description: 'CRM for G Suite',
  description: 'Copper is a CRM that integrates seamlessly with G Suite, designed for businesses that use Google for work.',
  images: [],
  onInitialize: () => {
    // Initialization logic
  },
  settings: [],
  config: {},
};

export default copperApp;