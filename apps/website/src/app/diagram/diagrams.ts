/**
 * Abacus Product Visualization - React Flow Data
 */

import type { Node, Edge } from '@xyflow/react';

// Human-readable descriptions for the dropdown
export const diagramDescriptions: Record<string, string> = {
  coreIdentity: '1. Core Identity - What is Abacus?',
  threePillars: '2. The Three Pillars',
  onboardingFlow: '3. 5-Minute Onboarding Flow',
  enhancedOnboardingFlow: '4. Enhanced Onboarding (with Website Scraping)',
  onboardingWizard: '5. Onboarding Setup Wizard (Detailed)',
  dataFlow: '6. Core Data Flow',
  featureMapComprehensive: '7. Feature Map (Comprehensive)',
  featureMap: '8. Feature Map (Simple)',
  statusStateMachine: '9. Merchant Status State Machine',
  collectionsWorkflow: '10. Collections Workflow',
  riskScoring: '11. Risk Scoring System',
  userRoles: '12. User Roles & Permissions',
  accessControl: '13. Access Control Management',
  techArchitecture: '14. Technical Architecture',
  merchantPortal: '15. Merchant Portal',
  websiteBrandingScraper: '16. Website Branding Scraper',
  brandingDataModel: '17. Branding Data Model',
  productRoadmap: '18. Product Roadmap (5 Phases)',
  sprintTimeline: '19. 20-Week Sprint Timeline',
  fullStackVision: '20. Full-Stack Lending Vision',
};

// ============================================================================
// 1. CORE IDENTITY - What is Abacus?
// ============================================================================

export const coreIdentity = {
  nodes: [
    { id: 'abacus', position: { x: 400, y: 300 }, data: { label: 'Abacus' }, type: 'input', style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', fontSize: 18, width: 120, textAlign: 'center' } },
    { id: 'what-it-is', position: { x: 100, y: 100 }, data: { label: 'What It Is' }, style: { background: '#e0f2fe', fontWeight: 'bold' } },
    { id: 'mca-os', position: { x: 0, y: 180 }, data: { label: 'MCA Operating System' }, style: { background: '#f0f9ff' } },
    { id: 'command-center', position: { x: 0, y: 230 }, data: { label: 'Portfolio Command Center' }, style: { background: '#f0f9ff' } },
    { id: 'spreadsheet-supercharger', position: { x: 0, y: 280 }, data: { label: 'Spreadsheet Supercharger' }, style: { background: '#f0f9ff' } },
    { id: 'who-for', position: { x: 400, y: 50 }, data: { label: "Who It's For" }, style: { background: '#dcfce7', fontWeight: 'bold' } },
    { id: 'mca-operators', position: { x: 320, y: 130 }, data: { label: 'MCA Operators' }, style: { background: '#f0fdf4' } },
    { id: 'portfolio-size', position: { x: 450, y: 130 }, data: { label: '$5M-$50M Portfolio' }, style: { background: '#f0fdf4' } },
    { id: 'team-size', position: { x: 385, y: 180 }, data: { label: '1-10 Person Teams' }, style: { background: '#f0fdf4' } },
    { id: 'problems', position: { x: 700, y: 100 }, data: { label: 'Problems Solved' }, style: { background: '#fef3c7', fontWeight: 'bold' } },
    { id: 'spreadsheet-chaos', position: { x: 650, y: 180 }, data: { label: 'Spreadsheet Chaos' }, style: { background: '#fefce8' } },
    { id: 'balance-inquiries', position: { x: 650, y: 230 }, data: { label: 'Manual Balance Inquiries' }, style: { background: '#fefce8' } },
    { id: 'missed-risk', position: { x: 650, y: 280 }, data: { label: 'Missed At-Risk Accounts' }, style: { background: '#fefce8' } },
    { id: 'amateur', position: { x: 650, y: 330 }, data: { label: 'Amateur Presentation' }, style: { background: '#fefce8' } },
    { id: 'value', position: { x: 400, y: 450 }, data: { label: '"Your Spreadsheet, Supercharged"' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 220 } },
    { id: 'five-min', position: { x: 250, y: 520 }, data: { label: '5-Minute Onboarding' }, style: { background: '#e0f2fe' } },
    { id: 'portal-value', position: { x: 450, y: 520 }, data: { label: '$50K Portal Included' }, style: { background: '#e0f2fe' } },
  ] as Node[],
  edges: [
    { id: 'e-abacus-what', source: 'abacus', target: 'what-it-is', type: 'smoothstep' },
    { id: 'e-what-mca', source: 'what-it-is', target: 'mca-os', type: 'smoothstep' },
    { id: 'e-what-cmd', source: 'what-it-is', target: 'command-center', type: 'smoothstep' },
    { id: 'e-what-ss', source: 'what-it-is', target: 'spreadsheet-supercharger', type: 'smoothstep' },
    { id: 'e-abacus-who', source: 'abacus', target: 'who-for', type: 'smoothstep' },
    { id: 'e-who-ops', source: 'who-for', target: 'mca-operators', type: 'smoothstep' },
    { id: 'e-who-size', source: 'who-for', target: 'portfolio-size', type: 'smoothstep' },
    { id: 'e-who-team', source: 'who-for', target: 'team-size', type: 'smoothstep' },
    { id: 'e-abacus-prob', source: 'abacus', target: 'problems', type: 'smoothstep' },
    { id: 'e-prob-chaos', source: 'problems', target: 'spreadsheet-chaos', type: 'smoothstep' },
    { id: 'e-prob-balance', source: 'problems', target: 'balance-inquiries', type: 'smoothstep' },
    { id: 'e-prob-risk', source: 'problems', target: 'missed-risk', type: 'smoothstep' },
    { id: 'e-prob-amateur', source: 'problems', target: 'amateur', type: 'smoothstep' },
    { id: 'e-abacus-value', source: 'abacus', target: 'value', type: 'smoothstep' },
    { id: 'e-value-5min', source: 'value', target: 'five-min', type: 'smoothstep' },
    { id: 'e-value-portal', source: 'value', target: 'portal-value', type: 'smoothstep' },
  ] as Edge[],
};

// ============================================================================
// 2. THREE PILLARS
// ============================================================================

export const threePillars = {
  nodes: [
    { id: 'header', position: { x: 350, y: 0 }, data: { label: 'THE THREE PILLARS OF ABACUS' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 280, textAlign: 'center' } },
    { id: 'pillar1', position: { x: 0, y: 100 }, data: { label: "PUSH, DON'T PULL" }, style: { background: '#e0f2fe', fontWeight: 'bold', width: 200, textAlign: 'center' } },
    { id: 'p1-a', position: { x: 0, y: 170 }, data: { label: 'Weekly digest delivered' }, style: { background: '#f0f9ff', width: 200 } },
    { id: 'p1-b', position: { x: 0, y: 220 }, data: { label: 'Real-time NSF alerts' }, style: { background: '#f0f9ff', width: 200 } },
    { id: 'p1-c', position: { x: 0, y: 270 }, data: { label: '"3 merchants need you"' }, style: { background: '#f0f9ff', width: 200 } },
    { id: 'pillar2', position: { x: 280, y: 100 }, data: { label: 'MEET THEM WHERE THEY ARE' }, style: { background: '#dcfce7', fontWeight: 'bold', width: 220, textAlign: 'center' } },
    { id: 'p2-a', position: { x: 280, y: 170 }, data: { label: 'Start with spreadsheets' }, style: { background: '#f0fdf4', width: 220 } },
    { id: 'p2-b', position: { x: 280, y: 220 }, data: { label: 'AI understands your columns' }, style: { background: '#f0fdf4', width: 220 } },
    { id: 'p2-c', position: { x: 280, y: 270 }, data: { label: 'No migration required' }, style: { background: '#f0fdf4', width: 220 } },
    { id: 'pillar3', position: { x: 580, y: 100 }, data: { label: 'CLARITY OVER COMPLEXITY' }, style: { background: '#fef3c7', fontWeight: 'bold', width: 200, textAlign: 'center' } },
    { id: 'p3-a', position: { x: 580, y: 170 }, data: { label: 'Show what matters' }, style: { background: '#fefce8', width: 200 } },
    { id: 'p3-b', position: { x: 580, y: 220 }, data: { label: 'Progressive disclosure' }, style: { background: '#fefce8', width: 200 } },
    { id: 'p3-c', position: { x: 580, y: 270 }, data: { label: '"5 merchants to call today"' }, style: { background: '#fefce8', width: 200 } },
  ] as Node[],
  edges: [
    { id: 'e-h-p1', source: 'header', target: 'pillar1', type: 'smoothstep' },
    { id: 'e-h-p2', source: 'header', target: 'pillar2', type: 'smoothstep' },
    { id: 'e-h-p3', source: 'header', target: 'pillar3', type: 'smoothstep' },
    { id: 'e-p1-a', source: 'pillar1', target: 'p1-a', type: 'smoothstep' },
    { id: 'e-p1-b', source: 'pillar1', target: 'p1-b', type: 'smoothstep' },
    { id: 'e-p1-c', source: 'pillar1', target: 'p1-c', type: 'smoothstep' },
    { id: 'e-p2-a', source: 'pillar2', target: 'p2-a', type: 'smoothstep' },
    { id: 'e-p2-b', source: 'pillar2', target: 'p2-b', type: 'smoothstep' },
    { id: 'e-p2-c', source: 'pillar2', target: 'p2-c', type: 'smoothstep' },
    { id: 'e-p3-a', source: 'pillar3', target: 'p3-a', type: 'smoothstep' },
    { id: 'e-p3-b', source: 'pillar3', target: 'p3-b', type: 'smoothstep' },
    { id: 'e-p3-c', source: 'pillar3', target: 'p3-c', type: 'smoothstep' },
  ] as Edge[],
};

// ============================================================================
// 3. 5-MINUTE ONBOARDING FLOW
// ============================================================================

export const onboardingFlow = {
  nodes: [
    { id: 'step1', position: { x: 0, y: 100 }, data: { label: '1. Connect\nGoogle Sheet' }, style: { background: '#f8fafc', width: 140, height: 60, textAlign: 'center' } },
    { id: 'step2', position: { x: 200, y: 100 }, data: { label: '2. AI Analyzes\nYour Columns' }, style: { background: '#0ea5e9', color: 'white', width: 140, height: 60, textAlign: 'center' } },
    { id: 'step3', position: { x: 400, y: 100 }, data: { label: '3. Confirm\nMappings' }, style: { background: '#22c55e', color: 'white', width: 140, height: 60, textAlign: 'center' } },
    { id: 'step4', position: { x: 600, y: 100 }, data: { label: '4. First Sync\nRuns' }, style: { background: '#f97316', color: 'white', width: 140, height: 60, textAlign: 'center' } },
    { id: 'step5', position: { x: 800, y: 100 }, data: { label: '5. Dashboard\nReady!' }, style: { background: '#8b5cf6', color: 'white', width: 140, height: 60, textAlign: 'center' } },
  ] as Node[],
  edges: [
    { id: 'e1-2', source: 'step1', target: 'step2', animated: true, style: { stroke: '#0ea5e9' } },
    { id: 'e2-3', source: 'step2', target: 'step3', animated: true, style: { stroke: '#22c55e' } },
    { id: 'e3-4', source: 'step3', target: 'step4', animated: true, style: { stroke: '#f97316' } },
    { id: 'e4-5', source: 'step4', target: 'step5', animated: true, style: { stroke: '#8b5cf6' } },
  ] as Edge[],
};

// ============================================================================
// 4. ENHANCED ONBOARDING FLOW (with Website Scraping)
// ============================================================================

export const enhancedOnboardingFlow = {
  nodes: [
    { id: 'step1', position: { x: 0, y: 0 }, data: { label: '1. Enter Website\nhonestfunding.com' }, style: { background: '#8b5cf6', color: 'white', width: 150, height: 60, textAlign: 'center' } },
    { id: 'step2', position: { x: 200, y: 0 }, data: { label: '2. AI Scrapes\nLogo, Colors, Info' }, style: { background: '#8b5cf6', color: 'white', width: 150, height: 60, textAlign: 'center' } },
    { id: 'step3', position: { x: 400, y: 0 }, data: { label: '3. Connect\nGoogle Sheet' }, style: { background: '#f8fafc', width: 150, height: 60, textAlign: 'center' } },
    { id: 'step4', position: { x: 0, y: 120 }, data: { label: '4. AI Analyzes\nYour Columns' }, style: { background: '#0ea5e9', color: 'white', width: 150, height: 60, textAlign: 'center' } },
    { id: 'step5', position: { x: 200, y: 120 }, data: { label: '5. Confirm\nMappings' }, style: { background: '#22c55e', color: 'white', width: 150, height: 60, textAlign: 'center' } },
    { id: 'step6', position: { x: 400, y: 120 }, data: { label: '6. First Sync\nRuns' }, style: { background: '#f97316', color: 'white', width: 150, height: 60, textAlign: 'center' } },
    { id: 'done', position: { x: 200, y: 240 }, data: { label: '🎉 READY!\nBranded Dashboard\nMerchant Portal\nLetter Templates' }, style: { background: '#16a34a', color: 'white', fontWeight: 'bold', width: 180, height: 80, textAlign: 'center' } },
    { id: 'time', position: { x: 450, y: 240 }, data: { label: '⏱️ 5 Minutes\nTotal Setup Time' }, style: { background: '#fef3c7', width: 120, height: 60, textAlign: 'center' } },
  ] as Node[],
  edges: [
    { id: 'e1-2', source: 'step1', target: 'step2', animated: true, style: { stroke: '#8b5cf6' } },
    { id: 'e2-3', source: 'step2', target: 'step3', animated: true, style: { stroke: '#8b5cf6' } },
    { id: 'e3-4', source: 'step3', target: 'step4', animated: true, style: { stroke: '#0ea5e9' } },
    { id: 'e4-5', source: 'step4', target: 'step5', animated: true, style: { stroke: '#22c55e' } },
    { id: 'e5-6', source: 'step5', target: 'step6', animated: true, style: { stroke: '#f97316' } },
    { id: 'e6-done', source: 'step6', target: 'done', animated: true, style: { stroke: '#16a34a' } },
  ] as Edge[],
};

// ============================================================================
// 5. CORE DATA FLOW
// ============================================================================

export const dataFlow = {
  nodes: [
    { id: 'source-label', position: { x: 50, y: 0 }, data: { label: 'YOUR DATA SOURCE' }, style: { background: '#f8fafc', fontWeight: 'bold', width: 160 } },
    { id: 'google-sheet', position: { x: 50, y: 50 }, data: { label: '📊 Google Sheet' }, style: { background: '#f1f5f9', width: 160, height: 50, textAlign: 'center' } },
    { id: 'platform-label', position: { x: 300, y: 0 }, data: { label: 'ABACUS PLATFORM' }, style: { background: '#e0f2fe', fontWeight: 'bold', width: 160 } },
    { id: 'ai-mapper', position: { x: 300, y: 60 }, data: { label: '🤖 AI Column Mapper' }, style: { background: '#bae6fd', width: 160 } },
    { id: 'sync-engine', position: { x: 300, y: 120 }, data: { label: '🔄 Sync Engine' }, style: { background: '#bae6fd', width: 160 } },
    { id: 'database', position: { x: 300, y: 180 }, data: { label: '💾 Your Data' }, style: { background: '#bae6fd', width: 160 } },
    { id: 'outputs-label', position: { x: 550, y: 0 }, data: { label: 'WHAT YOU GET' }, style: { background: '#dcfce7', fontWeight: 'bold', width: 180 } },
    { id: 'dashboard', position: { x: 550, y: 60 }, data: { label: '📈 Portfolio Dashboard' }, style: { background: '#bbf7d0', width: 180 } },
    { id: 'portal', position: { x: 550, y: 110 }, data: { label: '🏪 Merchant Portal' }, style: { background: '#bbf7d0', width: 180 } },
    { id: 'alerts', position: { x: 550, y: 160 }, data: { label: '🔔 Risk Alerts' }, style: { background: '#bbf7d0', width: 180 } },
    { id: 'letters', position: { x: 550, y: 210 }, data: { label: '📄 Generated Letters' }, style: { background: '#bbf7d0', width: 180 } },
    { id: 'reports', position: { x: 550, y: 260 }, data: { label: '📬 Weekly Summary' }, style: { background: '#bbf7d0', width: 180 } },
  ] as Node[],
  edges: [
    { id: 'e-sheet-ai', source: 'google-sheet', target: 'ai-mapper', animated: true },
    { id: 'e-ai-sync', source: 'ai-mapper', target: 'sync-engine' },
    { id: 'e-sync-db', source: 'sync-engine', target: 'database' },
    { id: 'e-db-dash', source: 'database', target: 'dashboard' },
    { id: 'e-db-portal', source: 'database', target: 'portal' },
    { id: 'e-db-alerts', source: 'database', target: 'alerts' },
    { id: 'e-db-letters', source: 'database', target: 'letters' },
    { id: 'e-db-reports', source: 'database', target: 'reports' },
  ] as Edge[],
};

// ============================================================================
// 6. FEATURE MAP
// ============================================================================

export const featureMap = {
  nodes: [
    { id: 'features', position: { x: 400, y: 250 }, data: { label: 'Abacus Features' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 150, textAlign: 'center' } },
    { id: 'dashboard', position: { x: 100, y: 50 }, data: { label: '📊 Portfolio Dashboard' }, style: { background: '#e0f2fe', fontWeight: 'bold', width: 170 } },
    { id: 'dash-1', position: { x: 0, y: 100 }, data: { label: 'Summary Cards' }, style: { background: '#f0f9ff', width: 130 } },
    { id: 'dash-2', position: { x: 0, y: 140 }, data: { label: 'Merchant Table' }, style: { background: '#f0f9ff', width: 130 } },
    { id: 'dash-3', position: { x: 0, y: 180 }, data: { label: 'Deal Details' }, style: { background: '#f0f9ff', width: 130 } },
    { id: 'dash-4', position: { x: 140, y: 100 }, data: { label: 'Search & Filter' }, style: { background: '#f0f9ff', width: 130 } },
    { id: 'dash-5', position: { x: 140, y: 140 }, data: { label: 'Trend Charts' }, style: { background: '#f0f9ff', width: 130 } },
    { id: 'portal', position: { x: 400, y: 50 }, data: { label: '🏪 Merchant Portal' }, style: { background: '#dcfce7', fontWeight: 'bold', width: 160 } },
    { id: 'portal-1', position: { x: 320, y: 100 }, data: { label: 'Balance View' }, style: { background: '#f0fdf4', width: 120 } },
    { id: 'portal-2', position: { x: 320, y: 140 }, data: { label: 'Payment History' }, style: { background: '#f0fdf4', width: 120 } },
    { id: 'portal-3', position: { x: 450, y: 100 }, data: { label: 'Make Payments' }, style: { background: '#f0fdf4', width: 120 } },
    { id: 'portal-4', position: { x: 450, y: 140 }, data: { label: 'Request Payoff' }, style: { background: '#f0fdf4', width: 120 } },
    { id: 'collections', position: { x: 700, y: 50 }, data: { label: '📞 Collections Console' }, style: { background: '#fef3c7', fontWeight: 'bold', width: 170 } },
    { id: 'coll-1', position: { x: 620, y: 100 }, data: { label: 'Risk Scoring' }, style: { background: '#fefce8', width: 130 } },
    { id: 'coll-2', position: { x: 620, y: 140 }, data: { label: 'Priority Queue' }, style: { background: '#fefce8', width: 130 } },
    { id: 'coll-3', position: { x: 760, y: 100 }, data: { label: 'Notes & Follow-ups' }, style: { background: '#fefce8', width: 130 } },
    { id: 'coll-4', position: { x: 760, y: 140 }, data: { label: 'Team Assignment' }, style: { background: '#fefce8', width: 130 } },
    { id: 'letters', position: { x: 100, y: 350 }, data: { label: '📄 Letter Generation' }, style: { background: '#f3e8ff', fontWeight: 'bold', width: 160 } },
    { id: 'let-1', position: { x: 20, y: 400 }, data: { label: 'Payoff Letters' }, style: { background: '#faf5ff', width: 120 } },
    { id: 'let-2', position: { x: 150, y: 400 }, data: { label: 'Zero Balance' }, style: { background: '#faf5ff', width: 120 } },
    { id: 'let-3', position: { x: 85, y: 440 }, data: { label: 'Renewal Letters' }, style: { background: '#faf5ff', width: 120 } },
    { id: 'alerts', position: { x: 400, y: 350 }, data: { label: '🔔 Alerts & Intelligence' }, style: { background: '#fee2e2', fontWeight: 'bold', width: 180 } },
    { id: 'alert-1', position: { x: 320, y: 400 }, data: { label: 'NSF Alerts' }, style: { background: '#fef2f2', width: 120 } },
    { id: 'alert-2', position: { x: 450, y: 400 }, data: { label: 'Late Alerts' }, style: { background: '#fef2f2', width: 120 } },
    { id: 'alert-3', position: { x: 320, y: 440 }, data: { label: 'Weekly Summary' }, style: { background: '#fef2f2', width: 120 } },
    { id: 'alert-4', position: { x: 450, y: 440 }, data: { label: 'AI Insights' }, style: { background: '#fef2f2', width: 120 } },
    { id: 'sync', position: { x: 700, y: 350 }, data: { label: '🔄 Google Sheets Sync' }, style: { background: '#dbeafe', fontWeight: 'bold', width: 170 } },
    { id: 'sync-1', position: { x: 620, y: 400 }, data: { label: 'Bi-directional' }, style: { background: '#eff6ff', width: 130 } },
    { id: 'sync-2', position: { x: 760, y: 400 }, data: { label: 'AI Column Mapping' }, style: { background: '#eff6ff', width: 130 } },
    { id: 'sync-3', position: { x: 690, y: 440 }, data: { label: 'Real-time Updates' }, style: { background: '#eff6ff', width: 130 } },
  ] as Node[],
  edges: [
    { id: 'e-f-dash', source: 'features', target: 'dashboard', type: 'smoothstep' },
    { id: 'e-dash-1', source: 'dashboard', target: 'dash-1', type: 'smoothstep' },
    { id: 'e-dash-2', source: 'dashboard', target: 'dash-2', type: 'smoothstep' },
    { id: 'e-dash-3', source: 'dashboard', target: 'dash-3', type: 'smoothstep' },
    { id: 'e-dash-4', source: 'dashboard', target: 'dash-4', type: 'smoothstep' },
    { id: 'e-dash-5', source: 'dashboard', target: 'dash-5', type: 'smoothstep' },
    { id: 'e-f-portal', source: 'features', target: 'portal', type: 'smoothstep' },
    { id: 'e-portal-1', source: 'portal', target: 'portal-1', type: 'smoothstep' },
    { id: 'e-portal-2', source: 'portal', target: 'portal-2', type: 'smoothstep' },
    { id: 'e-portal-3', source: 'portal', target: 'portal-3', type: 'smoothstep' },
    { id: 'e-portal-4', source: 'portal', target: 'portal-4', type: 'smoothstep' },
    { id: 'e-f-coll', source: 'features', target: 'collections', type: 'smoothstep' },
    { id: 'e-coll-1', source: 'collections', target: 'coll-1', type: 'smoothstep' },
    { id: 'e-coll-2', source: 'collections', target: 'coll-2', type: 'smoothstep' },
    { id: 'e-coll-3', source: 'collections', target: 'coll-3', type: 'smoothstep' },
    { id: 'e-coll-4', source: 'collections', target: 'coll-4', type: 'smoothstep' },
    { id: 'e-f-let', source: 'features', target: 'letters', type: 'smoothstep' },
    { id: 'e-let-1', source: 'letters', target: 'let-1', type: 'smoothstep' },
    { id: 'e-let-2', source: 'letters', target: 'let-2', type: 'smoothstep' },
    { id: 'e-let-3', source: 'letters', target: 'let-3', type: 'smoothstep' },
    { id: 'e-f-alert', source: 'features', target: 'alerts', type: 'smoothstep' },
    { id: 'e-alert-1', source: 'alerts', target: 'alert-1', type: 'smoothstep' },
    { id: 'e-alert-2', source: 'alerts', target: 'alert-2', type: 'smoothstep' },
    { id: 'e-alert-3', source: 'alerts', target: 'alert-3', type: 'smoothstep' },
    { id: 'e-alert-4', source: 'alerts', target: 'alert-4', type: 'smoothstep' },
    { id: 'e-f-sync', source: 'features', target: 'sync', type: 'smoothstep' },
    { id: 'e-sync-1', source: 'sync', target: 'sync-1', type: 'smoothstep' },
    { id: 'e-sync-2', source: 'sync', target: 'sync-2', type: 'smoothstep' },
    { id: 'e-sync-3', source: 'sync', target: 'sync-3', type: 'smoothstep' },
  ] as Edge[],
};

// ============================================================================
// 7. MERCHANT STATUS STATE MACHINE
// ============================================================================

export const statusStateMachine = {
  nodes: [
    { id: 'start', position: { x: 0, y: 150 }, data: { label: 'Deal Funded' }, type: 'input', style: { background: '#f8fafc', width: 100 } },
    { id: 'active', position: { x: 180, y: 150 }, data: { label: 'ACTIVE\n(Healthy)' }, style: { background: '#16a34a', color: 'white', fontWeight: 'bold', width: 120, height: 60, textAlign: 'center' } },
    { id: 'delinquent', position: { x: 180, y: 300 }, data: { label: 'DELINQUENT\n(1-7 days late)' }, style: { background: '#d97706', color: 'white', fontWeight: 'bold', width: 140, height: 60, textAlign: 'center' } },
    { id: 'collections', position: { x: 180, y: 450 }, data: { label: 'COLLECTIONS\n(7+ days late)' }, style: { background: '#dc2626', color: 'white', fontWeight: 'bold', width: 140, height: 60, textAlign: 'center' } },
    { id: 'default', position: { x: 400, y: 450 }, data: { label: 'DEFAULT\n(Terminal)' }, style: { background: '#991b1b', color: 'white', fontWeight: 'bold', width: 120, height: 60, textAlign: 'center' } },
    { id: 'paid-off', position: { x: 400, y: 150 }, data: { label: 'PAID OFF\n(Complete)' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 120, height: 60, textAlign: 'center' } },
    { id: 'renewed', position: { x: 550, y: 150 }, data: { label: 'RENEWED\n(New Deal)' }, style: { background: '#8b5cf6', color: 'white', fontWeight: 'bold', width: 120, height: 60, textAlign: 'center' } },
  ] as Node[],
  edges: [
    { id: 'e-start-active', source: 'start', target: 'active', label: 'Funded', animated: true },
    { id: 'e-active-delinquent', source: 'active', target: 'delinquent', label: 'NSF/Late', style: { stroke: '#d97706' } },
    { id: 'e-active-paidoff', source: 'active', target: 'paid-off', label: 'Balance = 0', style: { stroke: '#0ea5e9' } },
    { id: 'e-delinquent-active', source: 'delinquent', target: 'active', label: 'Payments Resume', style: { stroke: '#16a34a' }, type: 'smoothstep' },
    { id: 'e-delinquent-collections', source: 'delinquent', target: 'collections', label: '7+ Days', style: { stroke: '#dc2626' } },
    { id: 'e-collections-active', source: 'collections', target: 'active', label: 'Payments Resume', style: { stroke: '#16a34a' }, type: 'smoothstep' },
    { id: 'e-collections-default', source: 'collections', target: 'default', label: 'Unrecoverable', style: { stroke: '#991b1b' } },
    { id: 'e-collections-paidoff', source: 'collections', target: 'paid-off', label: 'Settled', style: { stroke: '#0ea5e9' }, type: 'smoothstep' },
    { id: 'e-paidoff-renewed', source: 'paid-off', target: 'renewed', label: 'New Deal', style: { stroke: '#8b5cf6' } },
    { id: 'e-renewed-active', source: 'renewed', target: 'active', label: 'Start Cycle', style: { stroke: '#16a34a' }, type: 'smoothstep' },
  ] as Edge[],
};

// ============================================================================
// 8. COLLECTIONS WORKFLOW
// ============================================================================

export const collectionsWorkflow = {
  nodes: [
    { id: 'trigger', position: { x: 300, y: 0 }, data: { label: '🔔 Payment Issue Detected' }, style: { background: '#fee2e2', fontWeight: 'bold', width: 200 } },
    { id: 'risk-check', position: { x: 300, y: 80 }, data: { label: 'Risk Level?' }, style: { background: '#fef3c7', width: 120, textAlign: 'center' } },
    { id: 'critical', position: { x: 50, y: 160 }, data: { label: '🔴 CRITICAL\nImmediate Alert\nAuto-assign' }, style: { background: '#dc2626', color: 'white', width: 140, height: 70, textAlign: 'center' } },
    { id: 'high', position: { x: 220, y: 160 }, data: { label: '🟠 HIGH\nPriority Queue\nDaily Digest' }, style: { background: '#f97316', color: 'white', width: 140, height: 70, textAlign: 'center' } },
    { id: 'medium', position: { x: 390, y: 160 }, data: { label: '🟡 MEDIUM\nWeekly Review' }, style: { background: '#eab308', color: 'white', width: 140, height: 70, textAlign: 'center' } },
    { id: 'low', position: { x: 560, y: 160 }, data: { label: '🟢 LOW\nMonitor Only' }, style: { background: '#16a34a', color: 'white', width: 140, height: 70, textAlign: 'center' } },
    { id: 'contact', position: { x: 135, y: 280 }, data: { label: '📞 Rep Contacts Merchant' }, style: { background: '#e0f2fe', width: 180 } },
    { id: 'outcome', position: { x: 135, y: 360 }, data: { label: 'Outcome?' }, style: { background: '#fef3c7', width: 100, textAlign: 'center' } },
    { id: 'promise', position: { x: 0, y: 440 }, data: { label: '📅 Payment Promise\nSchedule Follow-up' }, style: { background: '#dcfce7', width: 140, height: 50, textAlign: 'center' } },
    { id: 'paid', position: { x: 160, y: 440 }, data: { label: '✅ Payment Made\nClear from Queue' }, style: { background: '#dcfce7', width: 140, height: 50, textAlign: 'center' } },
    { id: 'no-contact', position: { x: 320, y: 440 }, data: { label: '📵 No Contact\nTry Again' }, style: { background: '#fef3c7', width: 140, height: 50, textAlign: 'center' } },
    { id: 'escalate', position: { x: 480, y: 440 }, data: { label: '⚠️ Unresponsive\nEscalate' }, style: { background: '#fee2e2', width: 140, height: 50, textAlign: 'center' } },
  ] as Node[],
  edges: [
    { id: 'e-trigger-risk', source: 'trigger', target: 'risk-check' },
    { id: 'e-risk-critical', source: 'risk-check', target: 'critical', label: '60+' },
    { id: 'e-risk-high', source: 'risk-check', target: 'high', label: '40-59' },
    { id: 'e-risk-medium', source: 'risk-check', target: 'medium', label: '20-39' },
    { id: 'e-risk-low', source: 'risk-check', target: 'low', label: '0-19' },
    { id: 'e-critical-contact', source: 'critical', target: 'contact' },
    { id: 'e-high-contact', source: 'high', target: 'contact' },
    { id: 'e-contact-outcome', source: 'contact', target: 'outcome' },
    { id: 'e-outcome-promise', source: 'outcome', target: 'promise' },
    { id: 'e-outcome-paid', source: 'outcome', target: 'paid' },
    { id: 'e-outcome-nocontact', source: 'outcome', target: 'no-contact' },
    { id: 'e-outcome-escalate', source: 'outcome', target: 'escalate' },
  ] as Edge[],
};

// ============================================================================
// 9. RISK SCORING
// ============================================================================

export const riskScoring = {
  nodes: [
    { id: 'title', position: { x: 200, y: 0 }, data: { label: 'RISK SCORE (0-100)' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 200, textAlign: 'center' } },
    { id: 'factors-label', position: { x: 0, y: 60 }, data: { label: 'SCORING FACTORS' }, style: { background: '#f1f5f9', fontWeight: 'bold', width: 150 } },
    { id: 'nsf-7d', position: { x: 0, y: 110 }, data: { label: 'NSF (7-day): 30 pts max' }, style: { background: '#fee2e2', width: 180 } },
    { id: 'dpd', position: { x: 0, y: 150 }, data: { label: 'Days Past Due: 30 pts max' }, style: { background: '#fee2e2', width: 180 } },
    { id: 'nsf-total', position: { x: 0, y: 190 }, data: { label: 'Total NSF: 20 pts max' }, style: { background: '#fef3c7', width: 180 } },
    { id: 'late-7d', position: { x: 0, y: 230 }, data: { label: 'Late (7-day): 20 pts max' }, style: { background: '#fef3c7', width: 180 } },
    { id: 'levels-label', position: { x: 280, y: 60 }, data: { label: 'RISK LEVELS' }, style: { background: '#f1f5f9', fontWeight: 'bold', width: 150 } },
    { id: 'low', position: { x: 250, y: 110 }, data: { label: '🟢 LOW (0-19)\nMonitor' }, style: { background: '#dcfce7', width: 120, height: 50, textAlign: 'center' } },
    { id: 'medium', position: { x: 380, y: 110 }, data: { label: '🟡 MEDIUM (20-39)\nReview' }, style: { background: '#fef9c3', width: 130, height: 50, textAlign: 'center' } },
    { id: 'high', position: { x: 250, y: 180 }, data: { label: '🟠 HIGH (40-59)\nContact' }, style: { background: '#fed7aa', width: 120, height: 50, textAlign: 'center' } },
    { id: 'critical', position: { x: 380, y: 180 }, data: { label: '🔴 CRITICAL (60+)\nEscalate' }, style: { background: '#fecaca', width: 130, height: 50, textAlign: 'center' } },
  ] as Node[],
  edges: [
    { id: 'e-title-factors', source: 'title', target: 'factors-label', type: 'smoothstep' },
    { id: 'e-title-levels', source: 'title', target: 'levels-label', type: 'smoothstep' },
    { id: 'e-f-nsf7', source: 'factors-label', target: 'nsf-7d' },
    { id: 'e-f-dpd', source: 'factors-label', target: 'dpd' },
    { id: 'e-f-nsft', source: 'factors-label', target: 'nsf-total' },
    { id: 'e-f-late', source: 'factors-label', target: 'late-7d' },
    { id: 'e-l-low', source: 'levels-label', target: 'low' },
    { id: 'e-l-med', source: 'levels-label', target: 'medium' },
    { id: 'e-l-high', source: 'levels-label', target: 'high' },
    { id: 'e-l-crit', source: 'levels-label', target: 'critical' },
  ] as Edge[],
};

// ============================================================================
// 10. USER ROLES
// ============================================================================

export const userRoles = {
  nodes: [
    { id: 'roles-title', position: { x: 250, y: 0 }, data: { label: 'USER ROLES' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 150, textAlign: 'center' } },
    { id: 'admin', position: { x: 0, y: 80 }, data: { label: '👑 ADMIN' }, style: { background: '#8b5cf6', color: 'white', fontWeight: 'bold', width: 140, textAlign: 'center' } },
    { id: 'admin-1', position: { x: 0, y: 130 }, data: { label: 'Full dashboard access' }, style: { background: '#f3e8ff', width: 140 } },
    { id: 'admin-2', position: { x: 0, y: 165 }, data: { label: 'Manage all deals' }, style: { background: '#f3e8ff', width: 140 } },
    { id: 'admin-3', position: { x: 0, y: 200 }, data: { label: 'Configure settings' }, style: { background: '#f3e8ff', width: 140 } },
    { id: 'admin-4', position: { x: 0, y: 235 }, data: { label: 'Manage users' }, style: { background: '#f3e8ff', width: 140 } },
    { id: 'admin-5', position: { x: 0, y: 270 }, data: { label: 'Generate any letter' }, style: { background: '#f3e8ff', width: 140 } },
    { id: 'rep', position: { x: 200, y: 80 }, data: { label: '👤 REP' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 140, textAlign: 'center' } },
    { id: 'rep-1', position: { x: 200, y: 130 }, data: { label: 'View assigned deals' }, style: { background: '#e0f2fe', width: 140 } },
    { id: 'rep-2', position: { x: 200, y: 165 }, data: { label: 'Collections access' }, style: { background: '#e0f2fe', width: 140 } },
    { id: 'rep-3', position: { x: 200, y: 200 }, data: { label: 'Log notes' }, style: { background: '#e0f2fe', width: 140 } },
    { id: 'rep-4', position: { x: 200, y: 235 }, data: { label: 'Generate letters' }, style: { background: '#e0f2fe', width: 140 } },
    { id: 'merchant', position: { x: 400, y: 80 }, data: { label: '🏪 MERCHANT' }, style: { background: '#16a34a', color: 'white', fontWeight: 'bold', width: 140, textAlign: 'center' } },
    { id: 'merch-1', position: { x: 400, y: 130 }, data: { label: 'View own balance' }, style: { background: '#dcfce7', width: 140 } },
    { id: 'merch-2', position: { x: 400, y: 165 }, data: { label: 'Payment history' }, style: { background: '#dcfce7', width: 140 } },
    { id: 'merch-3', position: { x: 400, y: 200 }, data: { label: 'Make payments' }, style: { background: '#dcfce7', width: 140 } },
    { id: 'merch-4', position: { x: 400, y: 235 }, data: { label: 'Request payoff' }, style: { background: '#dcfce7', width: 140 } },
  ] as Node[],
  edges: [
    { id: 'e-title-admin', source: 'roles-title', target: 'admin', type: 'smoothstep' },
    { id: 'e-title-rep', source: 'roles-title', target: 'rep', type: 'smoothstep' },
    { id: 'e-title-merch', source: 'roles-title', target: 'merchant', type: 'smoothstep' },
    { id: 'e-admin-1', source: 'admin', target: 'admin-1' },
    { id: 'e-admin-2', source: 'admin', target: 'admin-2' },
    { id: 'e-admin-3', source: 'admin', target: 'admin-3' },
    { id: 'e-admin-4', source: 'admin', target: 'admin-4' },
    { id: 'e-admin-5', source: 'admin', target: 'admin-5' },
    { id: 'e-rep-1', source: 'rep', target: 'rep-1' },
    { id: 'e-rep-2', source: 'rep', target: 'rep-2' },
    { id: 'e-rep-3', source: 'rep', target: 'rep-3' },
    { id: 'e-rep-4', source: 'rep', target: 'rep-4' },
    { id: 'e-merch-1', source: 'merchant', target: 'merch-1' },
    { id: 'e-merch-2', source: 'merchant', target: 'merch-2' },
    { id: 'e-merch-3', source: 'merchant', target: 'merch-3' },
    { id: 'e-merch-4', source: 'merchant', target: 'merch-4' },
    { id: 'e-admin-rep', source: 'admin', target: 'rep', style: { stroke: '#cbd5e1', strokeDasharray: '5,5' } },
    { id: 'e-rep-merch', source: 'rep', target: 'merchant', style: { stroke: '#cbd5e1', strokeDasharray: '5,5' } },
  ] as Edge[],
};

// ============================================================================
// 11. TECHNICAL ARCHITECTURE
// ============================================================================

export const techArchitecture = {
  nodes: [
    { id: 'your-data-label', position: { x: 0, y: 100 }, data: { label: 'YOUR DATA' }, style: { background: '#f8fafc', fontWeight: 'bold', width: 120 } },
    { id: 'google-sheet', position: { x: 0, y: 150 }, data: { label: '📊 Google Sheet' }, style: { background: '#f1f5f9', width: 120 } },
    { id: 'abacus-label', position: { x: 180, y: 50 }, data: { label: 'ABACUS' }, style: { background: '#e0f2fe', fontWeight: 'bold', width: 200 } },
    { id: 'ai', position: { x: 180, y: 100 }, data: { label: '🤖 AI Mapping' }, style: { background: '#bae6fd', width: 100 } },
    { id: 'sync', position: { x: 280, y: 100 }, data: { label: '🔄 Sync Engine' }, style: { background: '#bae6fd', width: 100 } },
    { id: 'db', position: { x: 180, y: 150 }, data: { label: '💾 Database' }, style: { background: '#bae6fd', width: 100 } },
    { id: 'app', position: { x: 280, y: 150 }, data: { label: '🖥️ Web App' }, style: { background: '#bae6fd', width: 100 } },
    { id: 'users-label', position: { x: 450, y: 50 }, data: { label: 'USERS' }, style: { background: '#dcfce7', fontWeight: 'bold', width: 160 } },
    { id: 'admin-dash', position: { x: 450, y: 100 }, data: { label: '📈 Admin Dashboard' }, style: { background: '#bbf7d0', width: 160 } },
    { id: 'portal', position: { x: 450, y: 145 }, data: { label: '🏪 Merchant Portal' }, style: { background: '#bbf7d0', width: 160 } },
    { id: 'email', position: { x: 450, y: 190 }, data: { label: '📧 Email Alerts' }, style: { background: '#bbf7d0', width: 160 } },
  ] as Node[],
  edges: [
    { id: 'e-sheet-ai', source: 'google-sheet', target: 'ai', animated: true },
    { id: 'e-ai-sync', source: 'ai', target: 'sync' },
    { id: 'e-sync-db', source: 'sync', target: 'db' },
    { id: 'e-db-app', source: 'db', target: 'app' },
    { id: 'e-app-admin', source: 'app', target: 'admin-dash' },
    { id: 'e-app-portal', source: 'app', target: 'portal' },
    { id: 'e-db-email', source: 'db', target: 'email' },
  ] as Edge[],
};

// ============================================================================
// 12. MERCHANT PORTAL
// ============================================================================

export const merchantPortal = {
  nodes: [
    { id: 'title', position: { x: 200, y: 0 }, data: { label: 'MERCHANT PORTAL\n(The "$50K Feature")' }, style: { background: '#16a34a', color: 'white', fontWeight: 'bold', width: 200, height: 50, textAlign: 'center' } },
    { id: 'features-label', position: { x: 0, y: 80 }, data: { label: 'WHAT MERCHANTS GET' }, style: { background: '#dcfce7', fontWeight: 'bold', width: 180 } },
    { id: 'balance', position: { x: 0, y: 130 }, data: { label: '💰 Balance View\nSee current balance' }, style: { background: '#f0fdf4', width: 150, height: 50, textAlign: 'center' } },
    { id: 'history', position: { x: 170, y: 130 }, data: { label: '📋 Payment History\nFull ledger with dates' }, style: { background: '#f0fdf4', width: 150, height: 50, textAlign: 'center' } },
    { id: 'payoff', position: { x: 340, y: 130 }, data: { label: '📄 Request Payoff\nGet letter instantly' }, style: { background: '#f0fdf4', width: 150, height: 50, textAlign: 'center' } },
    { id: 'pay', position: { x: 510, y: 130 }, data: { label: '💳 Make Payment\nPay online instantly' }, style: { background: '#f0fdf4', width: 150, height: 50, textAlign: 'center' } },
    { id: 'why-label', position: { x: 0, y: 220 }, data: { label: 'WHY THIS MATTERS' }, style: { background: '#fef3c7', fontWeight: 'bold', width: 180 } },
    { id: 'calls', position: { x: 0, y: 270 }, data: { label: '📞 Eliminates 10-20\n"What\'s my balance?"\ncalls per day' }, style: { background: '#fefce8', width: 160, height: 70, textAlign: 'center' } },
    { id: 'cost', position: { x: 180, y: 270 }, data: { label: '💵 Would cost\n$30-50K to build\ncustom' }, style: { background: '#fefce8', width: 160, height: 70, textAlign: 'center' } },
    { id: 'lockin', position: { x: 360, y: 270 }, data: { label: '🔒 Creates massive\nlock-in (merchants\nexpect the portal)' }, style: { background: '#fefce8', width: 160, height: 70, textAlign: 'center' } },
    { id: 'pro', position: { x: 540, y: 270 }, data: { label: '🏢 Makes small MCAs\nlook like enterprise\noperations' }, style: { background: '#fefce8', width: 160, height: 70, textAlign: 'center' } },
  ] as Node[],
  edges: [
    { id: 'e-title-feat', source: 'title', target: 'features-label', type: 'smoothstep' },
    { id: 'e-feat-bal', source: 'features-label', target: 'balance' },
    { id: 'e-feat-hist', source: 'features-label', target: 'history' },
    { id: 'e-feat-payoff', source: 'features-label', target: 'payoff' },
    { id: 'e-feat-pay', source: 'features-label', target: 'pay' },
    { id: 'e-title-why', source: 'title', target: 'why-label', type: 'smoothstep' },
    { id: 'e-why-calls', source: 'why-label', target: 'calls' },
    { id: 'e-why-cost', source: 'why-label', target: 'cost' },
    { id: 'e-why-lock', source: 'why-label', target: 'lockin' },
    { id: 'e-why-pro', source: 'why-label', target: 'pro' },
  ] as Edge[],
};

// ============================================================================
// 13. WEBSITE BRANDING SCRAPER
// ============================================================================

export const websiteBrandingScraper = {
  nodes: [
    { id: 'title', position: { x: 250, y: 0 }, data: { label: '🌐 AUTO-BRANDING FROM WEBSITE' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 250, textAlign: 'center' } },
    { id: 'input', position: { x: 250, y: 70 }, data: { label: '🔗 Enter Your Website URL\nhonestfunding.com' }, style: { background: '#f8fafc', width: 200, height: 50, textAlign: 'center', border: '2px dashed #cbd5e1' } },
    { id: 'scraper', position: { x: 250, y: 160 }, data: { label: '🤖 AI Website Analyzer' }, style: { background: '#8b5cf6', color: 'white', fontWeight: 'bold', width: 200, textAlign: 'center' } },
    { id: 'extract-label', position: { x: 0, y: 240 }, data: { label: 'WHAT WE EXTRACT' }, style: { background: '#e0f2fe', fontWeight: 'bold', width: 160 } },
    { id: 'logo', position: { x: 0, y: 290 }, data: { label: '🖼️ Logo\nAuto-detect from header/favicon' }, style: { background: '#f0f9ff', width: 180, height: 50, textAlign: 'center' } },
    { id: 'colors', position: { x: 0, y: 360 }, data: { label: '🎨 Color Scheme\nPrimary & secondary colors' }, style: { background: '#f0f9ff', width: 180, height: 50, textAlign: 'center' } },
    { id: 'company', position: { x: 0, y: 430 }, data: { label: '🏢 Company Name\nFrom title/meta/footer' }, style: { background: '#f0f9ff', width: 180, height: 50, textAlign: 'center' } },
    { id: 'address', position: { x: 0, y: 500 }, data: { label: '📍 Address\nFrom contact/footer' }, style: { background: '#f0f9ff', width: 180, height: 50, textAlign: 'center' } },
    { id: 'contact', position: { x: 0, y: 570 }, data: { label: '📞 Contact Info\nPhone, email, support' }, style: { background: '#f0f9ff', width: 180, height: 50, textAlign: 'center' } },
    { id: 'populate-label', position: { x: 450, y: 240 }, data: { label: 'AUTO-POPULATES' }, style: { background: '#dcfce7', fontWeight: 'bold', width: 160 } },
    { id: 'portal-brand', position: { x: 450, y: 290 }, data: { label: '🏪 Merchant Portal\nLogo, colors, name' }, style: { background: '#f0fdf4', width: 180, height: 50, textAlign: 'center' } },
    { id: 'letters', position: { x: 450, y: 360 }, data: { label: '📄 Letter Templates\nLetterhead, footer, signature' }, style: { background: '#f0fdf4', width: 180, height: 50, textAlign: 'center' } },
    { id: 'emails', position: { x: 450, y: 430 }, data: { label: '📧 Email Templates\nFrom name, branding' }, style: { background: '#f0fdf4', width: 180, height: 50, textAlign: 'center' } },
    { id: 'dashboard', position: { x: 450, y: 500 }, data: { label: '📊 Dashboard\nCompany name, theme' }, style: { background: '#f0fdf4', width: 180, height: 50, textAlign: 'center' } },
    { id: 'pdfs', position: { x: 450, y: 570 }, data: { label: '📑 PDF Exports\nBranded headers/footers' }, style: { background: '#f0fdf4', width: 180, height: 50, textAlign: 'center' } },
    { id: 'result', position: { x: 250, y: 660 }, data: { label: '✅ Review & Confirm\nEdit anything before saving' }, style: { background: '#16a34a', color: 'white', fontWeight: 'bold', width: 200, height: 50, textAlign: 'center' } },
  ] as Node[],
  edges: [
    { id: 'e-input-scraper', source: 'input', target: 'scraper', animated: true, style: { stroke: '#8b5cf6' } },
    { id: 'e-scraper-extract', source: 'scraper', target: 'extract-label', type: 'smoothstep' },
    { id: 'e-scraper-populate', source: 'scraper', target: 'populate-label', type: 'smoothstep' },
    { id: 'e-ext-logo', source: 'extract-label', target: 'logo' },
    { id: 'e-ext-colors', source: 'extract-label', target: 'colors' },
    { id: 'e-ext-company', source: 'extract-label', target: 'company' },
    { id: 'e-ext-address', source: 'extract-label', target: 'address' },
    { id: 'e-ext-contact', source: 'extract-label', target: 'contact' },
    { id: 'e-pop-portal', source: 'populate-label', target: 'portal-brand' },
    { id: 'e-pop-letters', source: 'populate-label', target: 'letters' },
    { id: 'e-pop-emails', source: 'populate-label', target: 'emails' },
    { id: 'e-pop-dash', source: 'populate-label', target: 'dashboard' },
    { id: 'e-pop-pdfs', source: 'populate-label', target: 'pdfs' },
    { id: 'e-logo-portal', source: 'logo', target: 'portal-brand', style: { stroke: '#cbd5e1', strokeDasharray: '3,3' }, type: 'smoothstep' },
    { id: 'e-colors-portal', source: 'colors', target: 'portal-brand', style: { stroke: '#cbd5e1', strokeDasharray: '3,3' }, type: 'smoothstep' },
    { id: 'e-company-letters', source: 'company', target: 'letters', style: { stroke: '#cbd5e1', strokeDasharray: '3,3' }, type: 'smoothstep' },
    { id: 'e-address-letters', source: 'address', target: 'letters', style: { stroke: '#cbd5e1', strokeDasharray: '3,3' }, type: 'smoothstep' },
    { id: 'e-contact-emails', source: 'contact', target: 'emails', style: { stroke: '#cbd5e1', strokeDasharray: '3,3' }, type: 'smoothstep' },
    { id: 'e-portal-result', source: 'portal-brand', target: 'result', type: 'smoothstep' },
    { id: 'e-pdfs-result', source: 'pdfs', target: 'result', type: 'smoothstep' },
  ] as Edge[],
};

// ============================================================================
// 14. BRANDING DATA MODEL
// ============================================================================

export const brandingDataModel = {
  nodes: [
    { id: 'title', position: { x: 200, y: 0 }, data: { label: 'BRANDING CONFIGURATION' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 220, textAlign: 'center' } },
    { id: 'source', position: { x: 0, y: 80 }, data: { label: '🌐 Website URL' }, style: { background: '#f8fafc', fontWeight: 'bold', width: 140 } },
    { id: 'extracted', position: { x: 200, y: 80 }, data: { label: 'AI EXTRACTED' }, style: { background: '#f3e8ff', fontWeight: 'bold', width: 140 } },
    { id: 'logo-url', position: { x: 100, y: 140 }, data: { label: 'logo_url\n(PNG/SVG)' }, style: { background: '#faf5ff', width: 100, height: 50, textAlign: 'center', fontSize: 11 } },
    { id: 'primary-color', position: { x: 210, y: 140 }, data: { label: 'primary_color\n#0ea5e9' }, style: { background: '#faf5ff', width: 100, height: 50, textAlign: 'center', fontSize: 11 } },
    { id: 'secondary-color', position: { x: 320, y: 140 }, data: { label: 'secondary_color\n#f97316' }, style: { background: '#faf5ff', width: 100, height: 50, textAlign: 'center', fontSize: 11 } },
    { id: 'company-name', position: { x: 100, y: 210 }, data: { label: 'company_name\n"Honest Funding"' }, style: { background: '#faf5ff', width: 110, height: 50, textAlign: 'center', fontSize: 11 } },
    { id: 'address', position: { x: 220, y: 210 }, data: { label: 'address\n"123 Main St..."' }, style: { background: '#faf5ff', width: 100, height: 50, textAlign: 'center', fontSize: 11 } },
    { id: 'phone', position: { x: 330, y: 210 }, data: { label: 'phone\n"(555) 123-4567"' }, style: { background: '#faf5ff', width: 100, height: 50, textAlign: 'center', fontSize: 11 } },
    { id: 'email', position: { x: 150, y: 280 }, data: { label: 'support_email\n"support@..."' }, style: { background: '#faf5ff', width: 110, height: 50, textAlign: 'center', fontSize: 11 } },
    { id: 'tagline', position: { x: 270, y: 280 }, data: { label: 'tagline\n"Funding Made..."' }, style: { background: '#faf5ff', width: 110, height: 50, textAlign: 'center', fontSize: 11 } },
    { id: 'outputs', position: { x: 200, y: 360 }, data: { label: 'APPLIES TO' }, style: { background: '#dcfce7', fontWeight: 'bold', width: 140 } },
    { id: 'out-portal', position: { x: 50, y: 420 }, data: { label: 'Merchant Portal' }, style: { background: '#f0fdf4', width: 110 } },
    { id: 'out-letters', position: { x: 170, y: 420 }, data: { label: 'Letters' }, style: { background: '#f0fdf4', width: 80 } },
    { id: 'out-emails', position: { x: 260, y: 420 }, data: { label: 'Emails' }, style: { background: '#f0fdf4', width: 80 } },
    { id: 'out-pdfs', position: { x: 350, y: 420 }, data: { label: 'PDF Exports' }, style: { background: '#f0fdf4', width: 90 } },
  ] as Node[],
  edges: [
    { id: 'e-source-extracted', source: 'source', target: 'extracted', animated: true },
    { id: 'e-ext-logo', source: 'extracted', target: 'logo-url' },
    { id: 'e-ext-primary', source: 'extracted', target: 'primary-color' },
    { id: 'e-ext-secondary', source: 'extracted', target: 'secondary-color' },
    { id: 'e-ext-company', source: 'extracted', target: 'company-name' },
    { id: 'e-ext-address', source: 'extracted', target: 'address' },
    { id: 'e-ext-phone', source: 'extracted', target: 'phone' },
    { id: 'e-ext-email', source: 'extracted', target: 'email' },
    { id: 'e-ext-tagline', source: 'extracted', target: 'tagline' },
    { id: 'e-logo-outputs', source: 'logo-url', target: 'outputs', type: 'smoothstep' },
    { id: 'e-email-outputs', source: 'email', target: 'outputs', type: 'smoothstep' },
    { id: 'e-out-portal', source: 'outputs', target: 'out-portal' },
    { id: 'e-out-letters', source: 'outputs', target: 'out-letters' },
    { id: 'e-out-emails', source: 'outputs', target: 'out-emails' },
    { id: 'e-out-pdfs', source: 'outputs', target: 'out-pdfs' },
  ] as Edge[],
};

// ============================================================================
// EXPORT ALL DIAGRAMS
// ============================================================================
// 15. ONBOARDING SETUP WIZARD (Detailed)
// ============================================================================

export const onboardingWizard = {
  nodes: [
    // Title
    { id: 'title', position: { x: 350, y: 0 }, data: { label: 'ONBOARDING SETUP WIZARD' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 250, textAlign: 'center' } },

    // Step 1: Website Branding
    { id: 'step1-header', position: { x: 0, y: 80 }, data: { label: 'STEP 1: BRANDING' }, style: { background: '#8b5cf6', color: 'white', fontWeight: 'bold', width: 200, textAlign: 'center' } },
    { id: 'step1-a', position: { x: 0, y: 130 }, data: { label: 'Enter website URL' }, style: { background: '#f3e8ff', width: 200 } },
    { id: 'step1-b', position: { x: 0, y: 165 }, data: { label: 'AI extracts logo & colors' }, style: { background: '#f3e8ff', width: 200 } },
    { id: 'step1-c', position: { x: 0, y: 200 }, data: { label: 'Company info auto-filled' }, style: { background: '#f3e8ff', width: 200 } },
    { id: 'step1-d', position: { x: 0, y: 235 }, data: { label: 'Review & confirm branding' }, style: { background: '#f3e8ff', width: 200 } },

    // Step 2: Data Connection
    { id: 'step2-header', position: { x: 250, y: 80 }, data: { label: 'STEP 2: DATA' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 200, textAlign: 'center' } },
    { id: 'step2-a', position: { x: 250, y: 130 }, data: { label: 'Connect Google Sheet' }, style: { background: '#e0f2fe', width: 200 } },
    { id: 'step2-b', position: { x: 250, y: 165 }, data: { label: 'OAuth authorization' }, style: { background: '#e0f2fe', width: 200 } },
    { id: 'step2-c', position: { x: 250, y: 200 }, data: { label: 'AI analyzes columns' }, style: { background: '#e0f2fe', width: 200 } },
    { id: 'step2-d', position: { x: 250, y: 235 }, data: { label: 'AI detects business logic' }, style: { background: '#e0f2fe', width: 200 } },
    { id: 'step2-e', position: { x: 250, y: 270 }, data: { label: 'Confirm field mappings' }, style: { background: '#e0f2fe', width: 200 } },

    // Step 3: Team Setup
    { id: 'step3-header', position: { x: 500, y: 80 }, data: { label: 'STEP 3: TEAM' }, style: { background: '#16a34a', color: 'white', fontWeight: 'bold', width: 200, textAlign: 'center' } },
    { id: 'step3-a', position: { x: 500, y: 130 }, data: { label: 'Invite team members' }, style: { background: '#dcfce7', width: 200 } },
    { id: 'step3-b', position: { x: 500, y: 165 }, data: { label: 'Assign roles (Admin/Rep)' }, style: { background: '#dcfce7', width: 200 } },
    { id: 'step3-c', position: { x: 500, y: 200 }, data: { label: 'Set permissions' }, style: { background: '#dcfce7', width: 200 } },
    { id: 'step3-d', position: { x: 500, y: 235 }, data: { label: 'Configure notifications' }, style: { background: '#dcfce7', width: 200 } },

    // Step 4: Configuration
    { id: 'step4-header', position: { x: 750, y: 80 }, data: { label: 'STEP 4: CONFIG' }, style: { background: '#f97316', color: 'white', fontWeight: 'bold', width: 200, textAlign: 'center' } },
    { id: 'step4-a', position: { x: 750, y: 130 }, data: { label: 'Letter templates' }, style: { background: '#ffedd5', width: 200 } },
    { id: 'step4-b', position: { x: 750, y: 165 }, data: { label: 'Risk thresholds' }, style: { background: '#ffedd5', width: 200 } },
    { id: 'step4-c', position: { x: 750, y: 200 }, data: { label: 'Sync frequency' }, style: { background: '#ffedd5', width: 200 } },
    { id: 'step4-d', position: { x: 750, y: 235 }, data: { label: 'Merchant portal settings' }, style: { background: '#ffedd5', width: 200 } },

    // Final
    { id: 'complete', position: { x: 375, y: 350 }, data: { label: '🎉 SETUP COMPLETE\nDashboard Ready!' }, style: { background: '#16a34a', color: 'white', fontWeight: 'bold', width: 200, height: 60, textAlign: 'center' } },

    // Time
    { id: 'time', position: { x: 600, y: 350 }, data: { label: '⏱️ ~5 Minutes' }, style: { background: '#fef3c7', width: 120, textAlign: 'center' } },
  ] as Node[],

  edges: [
    { id: 'e-title-s1', source: 'title', target: 'step1-header', type: 'smoothstep' },
    { id: 'e-title-s2', source: 'title', target: 'step2-header', type: 'smoothstep' },
    { id: 'e-title-s3', source: 'title', target: 'step3-header', type: 'smoothstep' },
    { id: 'e-title-s4', source: 'title', target: 'step4-header', type: 'smoothstep' },

    { id: 'e-s1-a', source: 'step1-header', target: 'step1-a' },
    { id: 'e-s1-b', source: 'step1-header', target: 'step1-b' },
    { id: 'e-s1-c', source: 'step1-header', target: 'step1-c' },
    { id: 'e-s1-d', source: 'step1-header', target: 'step1-d' },

    { id: 'e-s2-a', source: 'step2-header', target: 'step2-a' },
    { id: 'e-s2-b', source: 'step2-header', target: 'step2-b' },
    { id: 'e-s2-c', source: 'step2-header', target: 'step2-c' },
    { id: 'e-s2-d', source: 'step2-header', target: 'step2-d' },
    { id: 'e-s2-e', source: 'step2-header', target: 'step2-e' },

    { id: 'e-s3-a', source: 'step3-header', target: 'step3-a' },
    { id: 'e-s3-b', source: 'step3-header', target: 'step3-b' },
    { id: 'e-s3-c', source: 'step3-header', target: 'step3-c' },
    { id: 'e-s3-d', source: 'step3-header', target: 'step3-d' },

    { id: 'e-s4-a', source: 'step4-header', target: 'step4-a' },
    { id: 'e-s4-b', source: 'step4-header', target: 'step4-b' },
    { id: 'e-s4-c', source: 'step4-header', target: 'step4-c' },
    { id: 'e-s4-d', source: 'step4-header', target: 'step4-d' },

    { id: 'e-s1-complete', source: 'step1-d', target: 'complete', type: 'smoothstep', style: { stroke: '#8b5cf6' } },
    { id: 'e-s2-complete', source: 'step2-e', target: 'complete', type: 'smoothstep', style: { stroke: '#0ea5e9' } },
    { id: 'e-s3-complete', source: 'step3-d', target: 'complete', type: 'smoothstep', style: { stroke: '#16a34a' } },
    { id: 'e-s4-complete', source: 'step4-d', target: 'complete', type: 'smoothstep', style: { stroke: '#f97316' } },
  ] as Edge[],
};


// ============================================================================
// 16. COMPREHENSIVE FEATURE MAP
// ============================================================================

export const featureMapComprehensive = {
  nodes: [
    // Center
    { id: 'abacus', position: { x: 500, y: 400 }, data: { label: 'ABACUS\nFull-Stack MCA OS' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 160, height: 60, textAlign: 'center' } },

    // Category 1: Portfolio Dashboard
    { id: 'cat-dashboard', position: { x: 0, y: 0 }, data: { label: '📊 PORTFOLIO DASHBOARD' }, style: { background: '#e0f2fe', fontWeight: 'bold', width: 200 } },
    { id: 'dash-summary', position: { x: 0, y: 50 }, data: { label: 'Summary Cards' }, style: { background: '#f0f9ff', width: 180 } },
    { id: 'dash-table', position: { x: 0, y: 85 }, data: { label: 'Merchant Table' }, style: { background: '#f0f9ff', width: 180 } },
    { id: 'dash-deal', position: { x: 0, y: 120 }, data: { label: 'Deal Detail View' }, style: { background: '#f0f9ff', width: 180 } },
    { id: 'dash-search', position: { x: 0, y: 155 }, data: { label: 'Search & Filter' }, style: { background: '#f0f9ff', width: 180 } },
    { id: 'dash-charts', position: { x: 0, y: 190 }, data: { label: 'Trend Charts' }, style: { background: '#f0f9ff', width: 180 } },
    { id: 'dash-export', position: { x: 0, y: 225 }, data: { label: 'Data Export' }, style: { background: '#f0f9ff', width: 180 } },

    // Category 2: Merchant Portal
    { id: 'cat-portal', position: { x: 250, y: 0 }, data: { label: '🏪 MERCHANT PORTAL' }, style: { background: '#dcfce7', fontWeight: 'bold', width: 200 } },
    { id: 'portal-balance', position: { x: 250, y: 50 }, data: { label: 'Balance View' }, style: { background: '#f0fdf4', width: 180 } },
    { id: 'portal-history', position: { x: 250, y: 85 }, data: { label: 'Payment History' }, style: { background: '#f0fdf4', width: 180 } },
    { id: 'portal-payoff', position: { x: 250, y: 120 }, data: { label: 'Request Payoff Letter' }, style: { background: '#f0fdf4', width: 180 } },
    { id: 'portal-pay', position: { x: 250, y: 155 }, data: { label: 'Make Payments' }, style: { background: '#f0fdf4', width: 180 } },
    { id: 'portal-profile', position: { x: 250, y: 190 }, data: { label: 'Update Profile' }, style: { background: '#f0fdf4', width: 180 } },
    { id: 'portal-branding', position: { x: 250, y: 225 }, data: { label: 'White-Label Branding' }, style: { background: '#f0fdf4', width: 180 } },

    // Category 3: Collections
    { id: 'cat-collections', position: { x: 500, y: 0 }, data: { label: '📞 COLLECTIONS CONSOLE' }, style: { background: '#fef3c7', fontWeight: 'bold', width: 200 } },
    { id: 'coll-queue', position: { x: 500, y: 50 }, data: { label: 'Priority Queue' }, style: { background: '#fefce8', width: 180 } },
    { id: 'coll-risk', position: { x: 500, y: 85 }, data: { label: 'Risk Scoring' }, style: { background: '#fefce8', width: 180 } },
    { id: 'coll-notes', position: { x: 500, y: 120 }, data: { label: 'Notes & Follow-ups' }, style: { background: '#fefce8', width: 180 } },
    { id: 'coll-assign', position: { x: 500, y: 155 }, data: { label: 'Team Assignment' }, style: { background: '#fefce8', width: 180 } },
    { id: 'coll-workflow', position: { x: 500, y: 190 }, data: { label: 'Automated Workflow' }, style: { background: '#fefce8', width: 180 } },
    { id: 'coll-legal', position: { x: 500, y: 225 }, data: { label: 'Legal Escalation' }, style: { background: '#fefce8', width: 180 } },

    // Category 4: Letters & Documents
    { id: 'cat-letters', position: { x: 750, y: 0 }, data: { label: '📄 LETTER GENERATION' }, style: { background: '#f3e8ff', fontWeight: 'bold', width: 200 } },
    { id: 'let-payoff', position: { x: 750, y: 50 }, data: { label: 'Payoff Letters' }, style: { background: '#faf5ff', width: 180 } },
    { id: 'let-zero', position: { x: 750, y: 85 }, data: { label: 'Zero Balance Letters' }, style: { background: '#faf5ff', width: 180 } },
    { id: 'let-renewal', position: { x: 750, y: 120 }, data: { label: 'Renewal Letters' }, style: { background: '#faf5ff', width: 180 } },
    { id: 'let-demand', position: { x: 750, y: 155 }, data: { label: 'Demand Letters' }, style: { background: '#faf5ff', width: 180 } },
    { id: 'let-welcome', position: { x: 750, y: 190 }, data: { label: 'Welcome Letters' }, style: { background: '#faf5ff', width: 180 } },
    { id: 'let-templates', position: { x: 750, y: 225 }, data: { label: 'Custom Templates' }, style: { background: '#faf5ff', width: 180 } },

    // Category 5: Data Sync
    { id: 'cat-sync', position: { x: 0, y: 350 }, data: { label: '🔄 DATA SYNC' }, style: { background: '#dbeafe', fontWeight: 'bold', width: 200 } },
    { id: 'sync-sheets', position: { x: 0, y: 400 }, data: { label: 'Google Sheets Sync' }, style: { background: '#eff6ff', width: 180 } },
    { id: 'sync-bi', position: { x: 0, y: 435 }, data: { label: 'Bi-directional Sync' }, style: { background: '#eff6ff', width: 180 } },
    { id: 'sync-ai', position: { x: 0, y: 470 }, data: { label: 'AI Column Mapping' }, style: { background: '#eff6ff', width: 180 } },
    { id: 'sync-logic', position: { x: 0, y: 505 }, data: { label: 'AI Logic Analysis' }, style: { background: '#eff6ff', width: 180 } },
    { id: 'sync-realtime', position: { x: 0, y: 540 }, data: { label: 'Real-time Updates' }, style: { background: '#eff6ff', width: 180 } },

    // Category 6: Alerts & Intelligence
    { id: 'cat-alerts', position: { x: 0, y: 620 }, data: { label: '🔔 ALERTS & INTELLIGENCE' }, style: { background: '#fee2e2', fontWeight: 'bold', width: 200 } },
    { id: 'alert-nsf', position: { x: 0, y: 670 }, data: { label: 'NSF Alerts' }, style: { background: '#fef2f2', width: 180 } },
    { id: 'alert-late', position: { x: 0, y: 705 }, data: { label: 'Late Payment Alerts' }, style: { background: '#fef2f2', width: 180 } },
    { id: 'alert-weekly', position: { x: 0, y: 740 }, data: { label: 'Weekly Summary Email' }, style: { background: '#fef2f2', width: 180 } },
    { id: 'alert-ai', position: { x: 0, y: 775 }, data: { label: 'AI Insights' }, style: { background: '#fef2f2', width: 180 } },
    { id: 'alert-rules', position: { x: 0, y: 810 }, data: { label: 'Custom Alert Rules' }, style: { background: '#fef2f2', width: 180 } },

    // Category 7: Team & Access (new)
    { id: 'cat-team', position: { x: 250, y: 350 }, data: { label: '👥 TEAM & ACCESS' }, style: { background: '#fce7f3', fontWeight: 'bold', width: 200 } },
    { id: 'team-users', position: { x: 250, y: 400 }, data: { label: 'User Management' }, style: { background: '#fdf2f8', width: 180 } },
    { id: 'team-roles', position: { x: 250, y: 435 }, data: { label: 'Role Assignment' }, style: { background: '#fdf2f8', width: 180 } },
    { id: 'team-perms', position: { x: 250, y: 470 }, data: { label: 'Permissions Control' }, style: { background: '#fdf2f8', width: 180 } },
    { id: 'team-invite', position: { x: 250, y: 505 }, data: { label: 'Team Invitations' }, style: { background: '#fdf2f8', width: 180 } },
    { id: 'team-audit', position: { x: 250, y: 540 }, data: { label: 'Activity Audit Log' }, style: { background: '#fdf2f8', width: 180 } },

    // Category 8: Branding (new)
    { id: 'cat-brand', position: { x: 250, y: 620 }, data: { label: '🎨 BRANDING' }, style: { background: '#ccfbf1', fontWeight: 'bold', width: 200 } },
    { id: 'brand-logo', position: { x: 250, y: 670 }, data: { label: 'Logo Upload' }, style: { background: '#f0fdfa', width: 180 } },
    { id: 'brand-colors', position: { x: 250, y: 705 }, data: { label: 'Color Scheme' }, style: { background: '#f0fdfa', width: 180 } },
    { id: 'brand-scraper', position: { x: 250, y: 740 }, data: { label: 'AI Website Scraper' }, style: { background: '#f0fdfa', width: 180 } },
    { id: 'brand-letters', position: { x: 250, y: 775 }, data: { label: 'Branded Letters' }, style: { background: '#f0fdfa', width: 180 } },
    { id: 'brand-portal', position: { x: 250, y: 810 }, data: { label: 'White-Label Portal' }, style: { background: '#f0fdfa', width: 180 } },

    // Category 9: Payments (Future)
    { id: 'cat-payments', position: { x: 750, y: 350 }, data: { label: '💳 PAYMENTS (PHASE 3)' }, style: { background: '#e0e7ff', fontWeight: 'bold', width: 200 } },
    { id: 'pay-ach', position: { x: 750, y: 400 }, data: { label: 'ACH Collection' }, style: { background: '#eef2ff', width: 180 } },
    { id: 'pay-reconcile', position: { x: 750, y: 435 }, data: { label: 'Auto-Reconciliation' }, style: { background: '#eef2ff', width: 180 } },
    { id: 'pay-plaid', position: { x: 750, y: 470 }, data: { label: 'Bank Connection (Plaid)' }, style: { background: '#eef2ff', width: 180 } },
    { id: 'pay-schedule', position: { x: 750, y: 505 }, data: { label: 'Payment Scheduling' }, style: { background: '#eef2ff', width: 180 } },
    { id: 'pay-retry', position: { x: 750, y: 540 }, data: { label: 'Failed Payment Retry' }, style: { background: '#eef2ff', width: 180 } },

    // Category 10: Underwriting (Future)
    { id: 'cat-underwriting', position: { x: 750, y: 620 }, data: { label: '📋 UNDERWRITING (PHASE 4)' }, style: { background: '#fef3c7', fontWeight: 'bold', width: 200 } },
    { id: 'uw-docs', position: { x: 750, y: 670 }, data: { label: 'Document Upload' }, style: { background: '#fefce8', width: 180 } },
    { id: 'uw-extract', position: { x: 750, y: 705 }, data: { label: 'AI Document Extraction' }, style: { background: '#fefce8', width: 180 } },
    { id: 'uw-bank', position: { x: 750, y: 740 }, data: { label: 'Bank Statement Analysis' }, style: { background: '#fefce8', width: 180 } },
    { id: 'uw-scoring', position: { x: 750, y: 775 }, data: { label: 'Risk Scoring' }, style: { background: '#fefce8', width: 180 } },
    { id: 'uw-stacking', position: { x: 750, y: 810 }, data: { label: 'Stacking Detection' }, style: { background: '#fefce8', width: 180 } },
  ] as Node[],

  edges: [
    // Connect center to categories
    { id: 'e-ab-dash', source: 'abacus', target: 'cat-dashboard', type: 'smoothstep' },
    { id: 'e-ab-portal', source: 'abacus', target: 'cat-portal', type: 'smoothstep' },
    { id: 'e-ab-coll', source: 'abacus', target: 'cat-collections', type: 'smoothstep' },
    { id: 'e-ab-let', source: 'abacus', target: 'cat-letters', type: 'smoothstep' },
    { id: 'e-ab-sync', source: 'abacus', target: 'cat-sync', type: 'smoothstep' },
    { id: 'e-ab-alerts', source: 'abacus', target: 'cat-alerts', type: 'smoothstep' },
    { id: 'e-ab-team', source: 'abacus', target: 'cat-team', type: 'smoothstep' },
    { id: 'e-ab-brand', source: 'abacus', target: 'cat-brand', type: 'smoothstep' },
    { id: 'e-ab-pay', source: 'abacus', target: 'cat-payments', type: 'smoothstep', style: { strokeDasharray: '5,5', stroke: '#94a3b8' } },
    { id: 'e-ab-uw', source: 'abacus', target: 'cat-underwriting', type: 'smoothstep', style: { strokeDasharray: '5,5', stroke: '#94a3b8' } },
  ] as Edge[],
};


// ============================================================================
// 17. ACCESS CONTROL MANAGEMENT
// ============================================================================

export const accessControl = {
  nodes: [
    { id: 'title', position: { x: 300, y: 0 }, data: { label: 'ACCESS CONTROL MANAGEMENT' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 280, textAlign: 'center' } },

    // Admin Actions
    { id: 'admin-actions', position: { x: 0, y: 80 }, data: { label: '👑 ADMIN CAN:' }, style: { background: '#8b5cf6', color: 'white', fontWeight: 'bold', width: 200, textAlign: 'center' } },
    { id: 'aa-users', position: { x: 0, y: 130 }, data: { label: '➕ Add/Remove Users' }, style: { background: '#f3e8ff', width: 200 } },
    { id: 'aa-roles', position: { x: 0, y: 165 }, data: { label: '🔄 Change User Roles' }, style: { background: '#f3e8ff', width: 200 } },
    { id: 'aa-invite', position: { x: 0, y: 200 }, data: { label: '📧 Send Invitations' }, style: { background: '#f3e8ff', width: 200 } },
    { id: 'aa-perms', position: { x: 0, y: 235 }, data: { label: '🔒 Set Permissions' }, style: { background: '#f3e8ff', width: 200 } },
    { id: 'aa-audit', position: { x: 0, y: 270 }, data: { label: '📋 View Audit Log' }, style: { background: '#f3e8ff', width: 200 } },
    { id: 'aa-settings', position: { x: 0, y: 305 }, data: { label: '⚙️ Configure Settings' }, style: { background: '#f3e8ff', width: 200 } },

    // Role Types
    { id: 'roles', position: { x: 280, y: 80 }, data: { label: 'ROLE TYPES' }, style: { background: '#f1f5f9', fontWeight: 'bold', width: 180, textAlign: 'center' } },

    { id: 'role-admin', position: { x: 250, y: 140 }, data: { label: '👑 ADMIN\nFull access to everything' }, style: { background: '#8b5cf6', color: 'white', width: 120, height: 50, textAlign: 'center' } },
    { id: 'role-manager', position: { x: 380, y: 140 }, data: { label: '📊 MANAGER\nView all, limited config' }, style: { background: '#0ea5e9', color: 'white', width: 120, height: 50, textAlign: 'center' } },
    { id: 'role-rep', position: { x: 250, y: 210 }, data: { label: '👤 REP\nAssigned deals only' }, style: { background: '#16a34a', color: 'white', width: 120, height: 50, textAlign: 'center' } },
    { id: 'role-viewer', position: { x: 380, y: 210 }, data: { label: '👁️ VIEWER\nRead-only access' }, style: { background: '#64748b', color: 'white', width: 120, height: 50, textAlign: 'center' } },

    // Permission Matrix
    { id: 'perms', position: { x: 550, y: 80 }, data: { label: 'PERMISSIONS' }, style: { background: '#f1f5f9', fontWeight: 'bold', width: 200, textAlign: 'center' } },
    { id: 'perm-dash', position: { x: 550, y: 130 }, data: { label: '📊 View Dashboard' }, style: { background: '#f8fafc', width: 200 } },
    { id: 'perm-deals', position: { x: 550, y: 165 }, data: { label: '📝 Edit Deals' }, style: { background: '#f8fafc', width: 200 } },
    { id: 'perm-coll', position: { x: 550, y: 200 }, data: { label: '📞 Collections Access' }, style: { background: '#f8fafc', width: 200 } },
    { id: 'perm-letters', position: { x: 550, y: 235 }, data: { label: '📄 Generate Letters' }, style: { background: '#f8fafc', width: 200 } },
    { id: 'perm-reports', position: { x: 550, y: 270 }, data: { label: '📈 Export Reports' }, style: { background: '#f8fafc', width: 200 } },
    { id: 'perm-settings', position: { x: 550, y: 305 }, data: { label: '⚙️ Manage Settings' }, style: { background: '#f8fafc', width: 200 } },

    // User Management Flow
    { id: 'flow', position: { x: 200, y: 380 }, data: { label: 'USER MANAGEMENT FLOW' }, style: { background: '#e0f2fe', fontWeight: 'bold', width: 200, textAlign: 'center' } },

    { id: 'f-invite', position: { x: 0, y: 450 }, data: { label: '1. Send Invite\nEmail with link' }, style: { background: '#f0f9ff', width: 140, height: 50, textAlign: 'center' } },
    { id: 'f-accept', position: { x: 170, y: 450 }, data: { label: '2. User Accepts\nCreates account' }, style: { background: '#f0f9ff', width: 140, height: 50, textAlign: 'center' } },
    { id: 'f-role', position: { x: 340, y: 450 }, data: { label: '3. Assign Role\nSet permissions' }, style: { background: '#f0f9ff', width: 140, height: 50, textAlign: 'center' } },
    { id: 'f-active', position: { x: 510, y: 450 }, data: { label: '4. User Active\nCan access system' }, style: { background: '#dcfce7', width: 140, height: 50, textAlign: 'center' } },
  ] as Node[],

  edges: [
    { id: 'e-title-admin', source: 'title', target: 'admin-actions', type: 'smoothstep' },
    { id: 'e-title-roles', source: 'title', target: 'roles', type: 'smoothstep' },
    { id: 'e-title-perms', source: 'title', target: 'perms', type: 'smoothstep' },

    { id: 'e-aa-users', source: 'admin-actions', target: 'aa-users' },
    { id: 'e-aa-roles', source: 'admin-actions', target: 'aa-roles' },
    { id: 'e-aa-invite', source: 'admin-actions', target: 'aa-invite' },
    { id: 'e-aa-perms', source: 'admin-actions', target: 'aa-perms' },
    { id: 'e-aa-audit', source: 'admin-actions', target: 'aa-audit' },
    { id: 'e-aa-settings', source: 'admin-actions', target: 'aa-settings' },

    { id: 'e-roles-admin', source: 'roles', target: 'role-admin' },
    { id: 'e-roles-manager', source: 'roles', target: 'role-manager' },
    { id: 'e-roles-rep', source: 'roles', target: 'role-rep' },
    { id: 'e-roles-viewer', source: 'roles', target: 'role-viewer' },

    { id: 'e-perms-dash', source: 'perms', target: 'perm-dash' },
    { id: 'e-perms-deals', source: 'perms', target: 'perm-deals' },
    { id: 'e-perms-coll', source: 'perms', target: 'perm-coll' },
    { id: 'e-perms-letters', source: 'perms', target: 'perm-letters' },
    { id: 'e-perms-reports', source: 'perms', target: 'perm-reports' },
    { id: 'e-perms-settings', source: 'perms', target: 'perm-settings' },

    { id: 'e-f1-2', source: 'f-invite', target: 'f-accept', animated: true },
    { id: 'e-f2-3', source: 'f-accept', target: 'f-role', animated: true },
    { id: 'e-f3-4', source: 'f-role', target: 'f-active', animated: true },
  ] as Edge[],
};


// ============================================================================
// 18. PRODUCT ROADMAP (5 PHASES)
// ============================================================================

export const productRoadmap = {
  nodes: [
    { id: 'title', position: { x: 400, y: 0 }, data: { label: 'ABACUS PRODUCT ROADMAP' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 280, textAlign: 'center' } },

    // Phase 1
    { id: 'p1', position: { x: 0, y: 100 }, data: { label: 'PHASE 1: WEDGE\nSpreadsheet + Dashboard' }, style: { background: '#22c55e', color: 'white', fontWeight: 'bold', width: 200, height: 60, textAlign: 'center' } },
    { id: 'p1-target', position: { x: 0, y: 180 }, data: { label: 'Target: Small MCAs\n$5-25M portfolio' }, style: { background: '#dcfce7', width: 200, height: 50, textAlign: 'center' } },
    { id: 'p1-features', position: { x: 0, y: 250 }, data: { label: '• Google Sheets sync\n• AI column mapping\n• Portfolio dashboard\n• Basic letters' }, style: { background: '#f0fdf4', width: 200, height: 80, textAlign: 'left' } },
    { id: 'p1-goal', position: { x: 0, y: 350 }, data: { label: '🎯 50 customers\n$50K MRR' }, style: { background: '#bbf7d0', width: 200, height: 50, textAlign: 'center' } },

    // Phase 2
    { id: 'p2', position: { x: 230, y: 100 }, data: { label: 'PHASE 2: STICKINESS\nMerchant Portal' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 200, height: 60, textAlign: 'center' } },
    { id: 'p2-target', position: { x: 230, y: 180 }, data: { label: 'Create switching costs\nMerchants expect portal' }, style: { background: '#e0f2fe', width: 200, height: 50, textAlign: 'center' } },
    { id: 'p2-features', position: { x: 230, y: 250 }, data: { label: '• Merchant self-service\n• Balance lookup\n• Payment history\n• Request payoff' }, style: { background: '#f0f9ff', width: 200, height: 80, textAlign: 'left' } },
    { id: 'p2-goal', position: { x: 230, y: 350 }, data: { label: '🎯 100 customers\n$100K MRR' }, style: { background: '#bae6fd', width: 200, height: 50, textAlign: 'center' } },

    // Phase 3
    { id: 'p3', position: { x: 460, y: 100 }, data: { label: 'PHASE 3: PAYMENTS\nBank + Processing' }, style: { background: '#8b5cf6', color: 'white', fontWeight: 'bold', width: 200, height: 60, textAlign: 'center' } },
    { id: 'p3-target', position: { x: 460, y: 180 }, data: { label: 'Growing MCAs\n$25-100M portfolio' }, style: { background: '#f3e8ff', width: 200, height: 50, textAlign: 'center' } },
    { id: 'p3-features', position: { x: 460, y: 250 }, data: { label: '• Bank connection (Plaid)\n• Payment collection\n• Auto-reconciliation\n• Portal payments' }, style: { background: '#faf5ff', width: 200, height: 80, textAlign: 'left' } },
    { id: 'p3-goal', position: { x: 460, y: 350 }, data: { label: '🎯 200 customers\n$300K MRR' }, style: { background: '#e9d5ff', width: 200, height: 50, textAlign: 'center' } },

    // Phase 4
    { id: 'p4', position: { x: 690, y: 100 }, data: { label: 'PHASE 4: UNDERWRITING\nAI + Origination' }, style: { background: '#f97316', color: 'white', fontWeight: 'bold', width: 200, height: 60, textAlign: 'center' } },
    { id: 'p4-target', position: { x: 690, y: 180 }, data: { label: 'Mid-market MCAs\n$100M+ portfolio' }, style: { background: '#ffedd5', width: 200, height: 50, textAlign: 'center' } },
    { id: 'p4-features', position: { x: 690, y: 250 }, data: { label: '• AI underwriting\n• Bank statement analysis\n• Stacking detection\n• Broker portal' }, style: { background: '#fff7ed', width: 200, height: 80, textAlign: 'left' } },
    { id: 'p4-goal', position: { x: 690, y: 350 }, data: { label: '🎯 500 customers\n$1M MRR' }, style: { background: '#fed7aa', width: 200, height: 50, textAlign: 'center' } },

    // Phase 5
    { id: 'p5', position: { x: 920, y: 100 }, data: { label: 'PHASE 5: FULL STACK\nComplete OS' }, style: { background: '#dc2626', color: 'white', fontWeight: 'bold', width: 200, height: 60, textAlign: 'center' } },
    { id: 'p5-target', position: { x: 920, y: 180 }, data: { label: 'Enterprise + Verticals\nFactoring, Equipment' }, style: { background: '#fecaca', width: 200, height: 50, textAlign: 'center' } },
    { id: 'p5-features', position: { x: 920, y: 250 }, data: { label: '• Full lifecycle\n• Origination to close\n• API & embed\n• Multi-vertical' }, style: { background: '#fef2f2', width: 200, height: 80, textAlign: 'left' } },
    { id: 'p5-goal', position: { x: 920, y: 350 }, data: { label: '🎯 2000 customers\n$10M MRR' }, style: { background: '#fca5a5', width: 200, height: 50, textAlign: 'center' } },

    // Timeline
    { id: 'timeline', position: { x: 400, y: 450 }, data: { label: 'TIMELINE' }, style: { background: '#f1f5f9', fontWeight: 'bold', width: 280, textAlign: 'center' } },
    { id: 't1', position: { x: 0, y: 500 }, data: { label: '2025 H1' }, style: { background: '#22c55e', color: 'white', width: 200, textAlign: 'center' } },
    { id: 't2', position: { x: 230, y: 500 }, data: { label: '2025 H2' }, style: { background: '#0ea5e9', color: 'white', width: 200, textAlign: 'center' } },
    { id: 't3', position: { x: 460, y: 500 }, data: { label: '2026 H1' }, style: { background: '#8b5cf6', color: 'white', width: 200, textAlign: 'center' } },
    { id: 't4', position: { x: 690, y: 500 }, data: { label: '2026 H2' }, style: { background: '#f97316', color: 'white', width: 200, textAlign: 'center' } },
    { id: 't5', position: { x: 920, y: 500 }, data: { label: '2027+' }, style: { background: '#dc2626', color: 'white', width: 200, textAlign: 'center' } },
  ] as Node[],

  edges: [
    { id: 'e-p1-p2', source: 'p1', target: 'p2', animated: true, style: { stroke: '#0ea5e9' } },
    { id: 'e-p2-p3', source: 'p2', target: 'p3', animated: true, style: { stroke: '#8b5cf6' } },
    { id: 'e-p3-p4', source: 'p3', target: 'p4', animated: true, style: { stroke: '#f97316' } },
    { id: 'e-p4-p5', source: 'p4', target: 'p5', animated: true, style: { stroke: '#dc2626' } },

    { id: 'e-p1-t1', source: 'p1-goal', target: 't1', type: 'smoothstep', style: { stroke: '#22c55e' } },
    { id: 'e-p2-t2', source: 'p2-goal', target: 't2', type: 'smoothstep', style: { stroke: '#0ea5e9' } },
    { id: 'e-p3-t3', source: 'p3-goal', target: 't3', type: 'smoothstep', style: { stroke: '#8b5cf6' } },
    { id: 'e-p4-t4', source: 'p4-goal', target: 't4', type: 'smoothstep', style: { stroke: '#f97316' } },
    { id: 'e-p5-t5', source: 'p5-goal', target: 't5', type: 'smoothstep', style: { stroke: '#dc2626' } },

    { id: 'e-t1-t2', source: 't1', target: 't2' },
    { id: 'e-t2-t3', source: 't2', target: 't3' },
    { id: 'e-t3-t4', source: 't3', target: 't4' },
    { id: 'e-t4-t5', source: 't4', target: 't5' },
  ] as Edge[],
};


// ============================================================================
// 19. 20-WEEK SPRINT TIMELINE
// ============================================================================

export const sprintTimeline = {
  nodes: [
    { id: 'title', position: { x: 400, y: 0 }, data: { label: '20-WEEK SPRINT ROADMAP' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 280, textAlign: 'center' } },

    // Phase 1: Data Foundation (Weeks 1-4)
    { id: 'phase1', position: { x: 0, y: 80 }, data: { label: 'PHASE 1: DATA FOUNDATION\nWeeks 1-4' }, style: { background: '#22c55e', color: 'white', fontWeight: 'bold', width: 220, height: 50, textAlign: 'center' } },
    { id: 'w1', position: { x: 0, y: 150 }, data: { label: 'W1: Google Sheets Connection' }, style: { background: '#dcfce7', width: 220 } },
    { id: 'w2', position: { x: 0, y: 185 }, data: { label: 'W2: Column Mapping + AI' }, style: { background: '#dcfce7', width: 220 } },
    { id: 'w3', position: { x: 0, y: 220 }, data: { label: 'W3: Payment Sync & Ledger' }, style: { background: '#dcfce7', width: 220 } },
    { id: 'w4', position: { x: 0, y: 255 }, data: { label: 'W4: Pilot Go-Live' }, style: { background: '#dcfce7', width: 220 } },
    { id: 'p1-milestone', position: { x: 0, y: 300 }, data: { label: '✅ 2 pilots synced' }, style: { background: '#16a34a', color: 'white', width: 220, textAlign: 'center' } },

    // Phase 2: Admin Experience (Weeks 5-8)
    { id: 'phase2', position: { x: 260, y: 80 }, data: { label: 'PHASE 2: ADMIN EXPERIENCE\nWeeks 5-8' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 220, height: 50, textAlign: 'center' } },
    { id: 'w5', position: { x: 260, y: 150 }, data: { label: 'W5: Portfolio Overview' }, style: { background: '#e0f2fe', width: 220 } },
    { id: 'w6', position: { x: 260, y: 185 }, data: { label: 'W6: Deal Management' }, style: { background: '#e0f2fe', width: 220 } },
    { id: 'w7', position: { x: 260, y: 220 }, data: { label: 'W7: Deal Detail View' }, style: { background: '#e0f2fe', width: 220 } },
    { id: 'w8', position: { x: 260, y: 255 }, data: { label: 'W8: Onboarding Wizard' }, style: { background: '#e0f2fe', width: 220 } },
    { id: 'p2-milestone', position: { x: 260, y: 300 }, data: { label: '✅ 3-4 customers\n$1.5K MRR' }, style: { background: '#0284c7', color: 'white', width: 220, height: 40, textAlign: 'center' } },

    // Phase 3: Collections (Weeks 9-12)
    { id: 'phase3', position: { x: 520, y: 80 }, data: { label: 'PHASE 3: COLLECTIONS\nWeeks 9-12' }, style: { background: '#f97316', color: 'white', fontWeight: 'bold', width: 220, height: 50, textAlign: 'center' } },
    { id: 'w9', position: { x: 520, y: 150 }, data: { label: 'W9: Collections Dashboard' }, style: { background: '#ffedd5', width: 220 } },
    { id: 'w10', position: { x: 520, y: 185 }, data: { label: 'W10: Risk Levels & Assignment' }, style: { background: '#ffedd5', width: 220 } },
    { id: 'w11', position: { x: 520, y: 220 }, data: { label: 'W11: Notes & Follow-ups' }, style: { background: '#ffedd5', width: 220 } },
    { id: 'w12', position: { x: 520, y: 255 }, data: { label: 'W12: Polish + Customer #5' }, style: { background: '#ffedd5', width: 220 } },
    { id: 'p3-milestone', position: { x: 520, y: 300 }, data: { label: '✅ 5-7 customers\n$3K MRR' }, style: { background: '#ea580c', color: 'white', width: 220, height: 40, textAlign: 'center' } },

    // Phase 4: Letters (Weeks 13-14)
    { id: 'phase4', position: { x: 780, y: 80 }, data: { label: 'PHASE 4: LETTERS\nWeeks 13-14' }, style: { background: '#8b5cf6', color: 'white', fontWeight: 'bold', width: 220, height: 50, textAlign: 'center' } },
    { id: 'w13', position: { x: 780, y: 150 }, data: { label: 'W13: Payoff Letter PDF' }, style: { background: '#f3e8ff', width: 220 } },
    { id: 'w14', position: { x: 780, y: 185 }, data: { label: 'W14: Letter Suite' }, style: { background: '#f3e8ff', width: 220 } },
    { id: 'p4-milestone', position: { x: 780, y: 230 }, data: { label: '✅ 7-9 customers\n$4K MRR' }, style: { background: '#7c3aed', color: 'white', width: 220, height: 40, textAlign: 'center' } },

    // Phase 5: Access Control (Weeks 15-16)
    { id: 'phase5', position: { x: 0, y: 400 }, data: { label: 'PHASE 5: ACCESS CONTROL\nWeeks 15-16' }, style: { background: '#ec4899', color: 'white', fontWeight: 'bold', width: 220, height: 50, textAlign: 'center' } },
    { id: 'w15', position: { x: 0, y: 470 }, data: { label: 'W15: Role-Based Access' }, style: { background: '#fce7f3', width: 220 } },
    { id: 'w16', position: { x: 0, y: 505 }, data: { label: 'W16: Namespace Migration' }, style: { background: '#fce7f3', width: 220 } },
    { id: 'p5-milestone', position: { x: 0, y: 550 }, data: { label: '✅ 9-11 customers\n$5K MRR' }, style: { background: '#db2777', color: 'white', width: 220, height: 40, textAlign: 'center' } },

    // Phase 6: Alerts (Weeks 17-18)
    { id: 'phase6', position: { x: 260, y: 400 }, data: { label: 'PHASE 6: ALERTS\nWeeks 17-18' }, style: { background: '#14b8a6', color: 'white', fontWeight: 'bold', width: 220, height: 50, textAlign: 'center' } },
    { id: 'w17', position: { x: 260, y: 470 }, data: { label: 'W17: Push Notifications' }, style: { background: '#ccfbf1', width: 220 } },
    { id: 'w18', position: { x: 260, y: 505 }, data: { label: 'W18: Weekly Summary + AI' }, style: { background: '#ccfbf1', width: 220 } },
    { id: 'p6-milestone', position: { x: 260, y: 550 }, data: { label: '✅ 10-12 customers\n$6K MRR' }, style: { background: '#0d9488', color: 'white', width: 220, height: 40, textAlign: 'center' } },

    // Phase 7: Launch (Weeks 19-20)
    { id: 'phase7', position: { x: 520, y: 400 }, data: { label: 'PHASE 7: LAUNCH\nWeeks 19-20' }, style: { background: '#dc2626', color: 'white', fontWeight: 'bold', width: 220, height: 50, textAlign: 'center' } },
    { id: 'w19', position: { x: 520, y: 470 }, data: { label: 'W19: Polish & Performance' }, style: { background: '#fee2e2', width: 220 } },
    { id: 'w20', position: { x: 520, y: 505 }, data: { label: 'W20: Launch Week' }, style: { background: '#fee2e2', width: 220 } },
    { id: 'p7-milestone', position: { x: 520, y: 550 }, data: { label: '🚀 12-15 customers\n$7.5K MRR' }, style: { background: '#b91c1c', color: 'white', width: 220, height: 40, textAlign: 'center' } },

    // Final celebration
    { id: 'launch', position: { x: 780, y: 470 }, data: { label: '🎉 LAUNCH!\nJune 2026' }, style: { background: '#16a34a', color: 'white', fontWeight: 'bold', width: 180, height: 60, textAlign: 'center' } },
  ] as Node[],

  edges: [
    { id: 'e-p1-p2', source: 'p1-milestone', target: 'phase2', animated: true, type: 'smoothstep' },
    { id: 'e-p2-p3', source: 'p2-milestone', target: 'phase3', animated: true, type: 'smoothstep' },
    { id: 'e-p3-p4', source: 'p3-milestone', target: 'phase4', animated: true, type: 'smoothstep' },
    { id: 'e-p4-p5', source: 'p4-milestone', target: 'phase5', animated: true, type: 'smoothstep' },
    { id: 'e-p5-p6', source: 'p5-milestone', target: 'phase6', animated: true, type: 'smoothstep' },
    { id: 'e-p6-p7', source: 'p6-milestone', target: 'phase7', animated: true, type: 'smoothstep' },
    { id: 'e-p7-launch', source: 'p7-milestone', target: 'launch', animated: true, type: 'smoothstep', style: { stroke: '#16a34a' } },
  ] as Edge[],
};


// ============================================================================
// 20. FULL-STACK LENDING VISION
// ============================================================================

export const fullStackVision = {
  nodes: [
    { id: 'title', position: { x: 350, y: 0 }, data: { label: 'FULL-STACK LENDING LIFECYCLE' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 300, textAlign: 'center' } },

    // Lifecycle stages
    { id: 'originate', position: { x: 0, y: 100 }, data: { label: '1. ORIGINATE\nBroker submits deal' }, style: { background: '#8b5cf6', color: 'white', fontWeight: 'bold', width: 150, height: 60, textAlign: 'center' } },
    { id: 'underwrite', position: { x: 180, y: 100 }, data: { label: '2. UNDERWRITE\nAI evaluates risk' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 150, height: 60, textAlign: 'center' } },
    { id: 'fund', position: { x: 360, y: 100 }, data: { label: '3. FUND\nMoney sent' }, style: { background: '#16a34a', color: 'white', fontWeight: 'bold', width: 150, height: 60, textAlign: 'center' } },
    { id: 'service', position: { x: 540, y: 100 }, data: { label: '4. SERVICE\nDaily operations' }, style: { background: '#f97316', color: 'white', fontWeight: 'bold', width: 150, height: 60, textAlign: 'center' } },
    { id: 'collect', position: { x: 720, y: 100 }, data: { label: '5. COLLECT\nHandle issues' }, style: { background: '#dc2626', color: 'white', fontWeight: 'bold', width: 150, height: 60, textAlign: 'center' } },

    // Originate features
    { id: 'orig-broker', position: { x: 0, y: 200 }, data: { label: 'Broker Portal' }, style: { background: '#f3e8ff', width: 140 } },
    { id: 'orig-intake', position: { x: 0, y: 235 }, data: { label: 'Deal Intake Form' }, style: { background: '#f3e8ff', width: 140 } },
    { id: 'orig-docs', position: { x: 0, y: 270 }, data: { label: 'Document Collection' }, style: { background: '#f3e8ff', width: 140 } },
    { id: 'orig-leads', position: { x: 0, y: 305 }, data: { label: 'Lead Tracking' }, style: { background: '#f3e8ff', width: 140 } },

    // Underwrite features
    { id: 'uw-ai', position: { x: 180, y: 200 }, data: { label: 'AI Risk Scoring' }, style: { background: '#e0f2fe', width: 140 } },
    { id: 'uw-bank', position: { x: 180, y: 235 }, data: { label: 'Bank Statement Analysis' }, style: { background: '#e0f2fe', width: 140 } },
    { id: 'uw-stack', position: { x: 180, y: 270 }, data: { label: 'Stacking Detection' }, style: { background: '#e0f2fe', width: 140 } },
    { id: 'uw-decision', position: { x: 180, y: 305 }, data: { label: 'Auto-Decisioning' }, style: { background: '#e0f2fe', width: 140 } },

    // Fund features
    { id: 'fund-approval', position: { x: 360, y: 200 }, data: { label: 'Approval Workflow' }, style: { background: '#dcfce7', width: 140 } },
    { id: 'fund-esign', position: { x: 360, y: 235 }, data: { label: 'E-Signature' }, style: { background: '#dcfce7', width: 140 } },
    { id: 'fund-wire', position: { x: 360, y: 270 }, data: { label: 'Wire/ACH Transfer' }, style: { background: '#dcfce7', width: 140 } },
    { id: 'fund-syndication', position: { x: 360, y: 305 }, data: { label: 'Syndication' }, style: { background: '#dcfce7', width: 140 } },

    // Service features
    { id: 'serv-portal', position: { x: 540, y: 200 }, data: { label: 'Merchant Portal' }, style: { background: '#ffedd5', width: 140 } },
    { id: 'serv-payments', position: { x: 540, y: 235 }, data: { label: 'Payment Processing' }, style: { background: '#ffedd5', width: 140 } },
    { id: 'serv-reconcile', position: { x: 540, y: 270 }, data: { label: 'Auto-Reconciliation' }, style: { background: '#ffedd5', width: 140 } },
    { id: 'serv-alerts', position: { x: 540, y: 305 }, data: { label: 'Real-time Alerts' }, style: { background: '#ffedd5', width: 140 } },

    // Collect features
    { id: 'coll-queue', position: { x: 720, y: 200 }, data: { label: 'Collections Queue' }, style: { background: '#fee2e2', width: 140 } },
    { id: 'coll-auto', position: { x: 720, y: 235 }, data: { label: 'Automated Sequences' }, style: { background: '#fee2e2', width: 140 } },
    { id: 'coll-legal', position: { x: 720, y: 270 }, data: { label: 'Legal Documents' }, style: { background: '#fee2e2', width: 140 } },
    { id: 'coll-settle', position: { x: 720, y: 305 }, data: { label: 'Settlement Workflow' }, style: { background: '#fee2e2', width: 140 } },

    // Renew cycle
    { id: 'renew', position: { x: 360, y: 400 }, data: { label: '🔄 RENEW\nBack to Originate' }, style: { background: '#16a34a', color: 'white', fontWeight: 'bold', width: 180, height: 50, textAlign: 'center' } },

    // Abacus backbone
    { id: 'backbone', position: { x: 250, y: 500 }, data: { label: 'ABACUS: The Infrastructure Layer\nAll stages powered by one platform' }, style: { background: '#0f172a', color: 'white', fontWeight: 'bold', width: 400, height: 50, textAlign: 'center' } },
  ] as Node[],

  edges: [
    { id: 'e-o-u', source: 'originate', target: 'underwrite', animated: true },
    { id: 'e-u-f', source: 'underwrite', target: 'fund', animated: true },
    { id: 'e-f-s', source: 'fund', target: 'service', animated: true },
    { id: 'e-s-c', source: 'service', target: 'collect', animated: true },

    { id: 'e-o1', source: 'originate', target: 'orig-broker' },
    { id: 'e-o2', source: 'originate', target: 'orig-intake' },
    { id: 'e-o3', source: 'originate', target: 'orig-docs' },
    { id: 'e-o4', source: 'originate', target: 'orig-leads' },

    { id: 'e-u1', source: 'underwrite', target: 'uw-ai' },
    { id: 'e-u2', source: 'underwrite', target: 'uw-bank' },
    { id: 'e-u3', source: 'underwrite', target: 'uw-stack' },
    { id: 'e-u4', source: 'underwrite', target: 'uw-decision' },

    { id: 'e-f1', source: 'fund', target: 'fund-approval' },
    { id: 'e-f2', source: 'fund', target: 'fund-esign' },
    { id: 'e-f3', source: 'fund', target: 'fund-wire' },
    { id: 'e-f4', source: 'fund', target: 'fund-syndication' },

    { id: 'e-s1', source: 'service', target: 'serv-portal' },
    { id: 'e-s2', source: 'service', target: 'serv-payments' },
    { id: 'e-s3', source: 'service', target: 'serv-reconcile' },
    { id: 'e-s4', source: 'service', target: 'serv-alerts' },

    { id: 'e-c1', source: 'collect', target: 'coll-queue' },
    { id: 'e-c2', source: 'collect', target: 'coll-auto' },
    { id: 'e-c3', source: 'collect', target: 'coll-legal' },
    { id: 'e-c4', source: 'collect', target: 'coll-settle' },

    { id: 'e-service-renew', source: 'service', target: 'renew', type: 'smoothstep', style: { stroke: '#16a34a' } },
    { id: 'e-renew-orig', source: 'renew', target: 'originate', type: 'smoothstep', style: { stroke: '#16a34a' }, animated: true },

    { id: 'e-o-bb', source: 'orig-leads', target: 'backbone', type: 'smoothstep', style: { strokeDasharray: '3,3', stroke: '#64748b' } },
    { id: 'e-c-bb', source: 'coll-settle', target: 'backbone', type: 'smoothstep', style: { strokeDasharray: '3,3', stroke: '#64748b' } },
  ] as Edge[],
};


// ============================================================================
// EXPORT ALL DIAGRAMS
// ============================================================================

export const allDiagrams = {
  coreIdentity,
  threePillars,
  onboardingFlow,
  enhancedOnboardingFlow,
  onboardingWizard,
  dataFlow,
  featureMapComprehensive,
  featureMap,
  statusStateMachine,
  collectionsWorkflow,
  riskScoring,
  userRoles,
  accessControl,
  techArchitecture,
  merchantPortal,
  websiteBrandingScraper,
  brandingDataModel,
  productRoadmap,
  sprintTimeline,
  fullStackVision,
};

export default allDiagrams;
