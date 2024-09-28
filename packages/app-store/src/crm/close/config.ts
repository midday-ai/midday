import { IntegrationCategory, IntegrationConfig } from '../../types';
import { Logo } from './assets/logo';

const closeApp: IntegrationConfig = {
  name: 'Close',
  id: 'close',
  category: IntegrationCategory.CRM,
  active: false,
  logo: Logo,
  short_description: 'Sales engagement CRM',
  description: 'Close is a sales engagement CRM designed to help sales teams turn more leads into revenue.',
  images: [],
  onInitialize: () => {
    // Initialization logic
  },
  settings: [],
  config: {},
};

export default closeApp;