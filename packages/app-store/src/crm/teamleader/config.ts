import { IntegrationCategory, IntegrationConfig } from '../../types';
import { Logo } from './assets/logo';

const teamleaderApp: IntegrationConfig = {
  name: 'Teamleader',
  id: 'teamleader',
  category: IntegrationCategory.CRM,
  active: false,
  logo: Logo,
  short_description: 'All-in-one work management software',
  description: 'Teamleader is an all-in-one work management software that combines CRM, project management, and invoicing.',
  images: [],
  onInitialize: () => {
    // Initialization logic
  },
  settings: [],
  config: {},
};

export default teamleaderApp;