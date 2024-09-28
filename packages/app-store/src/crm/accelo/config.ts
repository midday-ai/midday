import { IntegrationCategory, IntegrationConfig } from '../../types';
import { Logo } from './assets/logo';

const acceloApp: IntegrationConfig = {
    name: 'Accelo',
    id: 'accelo',
    category: IntegrationCategory.CRM,
    active: false,
    logo: Logo,
    short_description: 'Professional services automation platform',
    description: 'Accelo is a cloud-based platform that helps professional service businesses manage their operations, including client work, sales, and financials.',
    images: [],
    onInitialize: () => {
        // Initialization logic
    },
    settings: [],
    config: {},
};

export default acceloApp;