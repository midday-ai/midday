import { IntegrationCategory, IntegrationConfig } from '../../types';
import { Logo } from './assets/logo';

const insightlyApp: IntegrationConfig = {
  name: 'Insightly',
  id: 'insightly',
  category: IntegrationCategory.CRM,
  active: false,
  logo: Logo,
  short_description: 'CRM for project and business management',
  description: 'Insightly is a CRM that combines project management and business management features to help organizations grow.',
  images: [],
  onInitialize: () => {
    // Initialization logic
  },
  settings: [],
  config: {},
};

export default insightlyApp;