/**
 * Abacus Product Visualization - React Flow Data
 *
 * This file contains node and edge definitions for visualizing
 * Abacus features and functionality using React Flow.
 *
 * Usage:
 *   import { onboardingFlow, dataFlow, featureMap, ... } from './react-flow-diagrams';
 *   <ReactFlow nodes={onboardingFlow.nodes} edges={onboardingFlow.edges} />
 */

import type { Node, Edge } from '@xyflow/react';

// ============================================================================
// 1. CORE IDENTITY - What is Abacus?
// ============================================================================

export const coreIdentity = {
  nodes: [
    // Center
    { id: 'abacus', position: { x: 400, y: 300 }, data: { label: 'Abacus' }, type: 'input', style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', fontSize: 18, width: 120, textAlign: 'center' } },

    // What It Is
    { id: 'what-it-is', position: { x: 100, y: 100 }, data: { label: 'What It Is' }, style: { background: '#e0f2fe', fontWeight: 'bold' } },
    { id: 'mca-os', position: { x: 0, y: 180 }, data: { label: 'MCA Operating System' }, style: { background: '#f0f9ff' } },
    { id: 'command-center', position: { x: 0, y: 230 }, data: { label: 'Portfolio Command Center' }, style: { background: '#f0f9ff' } },
    { id: 'spreadsheet-supercharger', position: { x: 0, y: 280 }, data: { label: 'Spreadsheet Supercharger' }, style: { background: '#f0f9ff' } },

    // Who It's For
    { id: 'who-for', position: { x: 400, y: 50 }, data: { label: "Who It's For" }, style: { background: '#dcfce7', fontWeight: 'bold' } },
    { id: 'mca-operators', position: { x: 320, y: 130 }, data: { label: 'MCA Operators' }, style: { background: '#f0fdf4' } },
    { id: 'portfolio-size', position: { x: 450, y: 130 }, data: { label: '$5M-$50M Portfolio' }, style: { background: '#f0fdf4' } },
    { id: 'team-size', position: { x: 385, y: 180 }, data: { label: '1-10 Person Teams' }, style: { background: '#f0fdf4' } },

    // Problems Solved
    { id: 'problems', position: { x: 700, y: 100 }, data: { label: 'Problems Solved' }, style: { background: '#fef3c7', fontWeight: 'bold' } },
    { id: 'spreadsheet-chaos', position: { x: 650, y: 180 }, data: { label: 'Spreadsheet Chaos' }, style: { background: '#fefce8' } },
    { id: 'balance-inquiries', position: { x: 650, y: 230 }, data: { label: 'Manual Balance Inquiries' }, style: { background: '#fefce8' } },
    { id: 'missed-risk', position: { x: 650, y: 280 }, data: { label: 'Missed At-Risk Accounts' }, style: { background: '#fefce8' } },
    { id: 'amateur', position: { x: 650, y: 330 }, data: { label: 'Amateur Presentation' }, style: { background: '#fefce8' } },

    // Value Proposition
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
    // Header
    { id: 'header', position: { x: 350, y: 0 }, data: { label: 'THE THREE PILLARS OF ABACUS' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 280, textAlign: 'center' } },

    // Pillar 1: Push Don't Pull
    { id: 'pillar1', position: { x: 0, y: 100 }, data: { label: "PUSH, DON'T PULL" }, style: { background: '#e0f2fe', fontWeight: 'bold', width: 200, textAlign: 'center' } },
    { id: 'p1-a', position: { x: 0, y: 170 }, data: { label: 'Weekly digest delivered' }, style: { background: '#f0f9ff', width: 200 } },
    { id: 'p1-b', position: { x: 0, y: 220 }, data: { label: 'Real-time NSF alerts' }, style: { background: '#f0f9ff', width: 200 } },
    { id: 'p1-c', position: { x: 0, y: 270 }, data: { label: '"3 merchants need you"' }, style: { background: '#f0f9ff', width: 200 } },

    // Pillar 2: Meet Them Where They Are
    { id: 'pillar2', position: { x: 280, y: 100 }, data: { label: 'MEET THEM WHERE THEY ARE' }, style: { background: '#dcfce7', fontWeight: 'bold', width: 220, textAlign: 'center' } },
    { id: 'p2-a', position: { x: 280, y: 170 }, data: { label: 'Start with spreadsheets' }, style: { background: '#f0fdf4', width: 220 } },
    { id: 'p2-b', position: { x: 280, y: 220 }, data: { label: 'AI understands your columns' }, style: { background: '#f0fdf4', width: 220 } },
    { id: 'p2-c', position: { x: 280, y: 270 }, data: { label: 'No migration required' }, style: { background: '#f0fdf4', width: 220 } },

    // Pillar 3: Clarity Over Complexity
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
// 4. CORE DATA FLOW
// ============================================================================

export const dataFlow = {
  nodes: [
    // Source
    { id: 'source-label', position: { x: 50, y: 0 }, data: { label: 'YOUR DATA SOURCE' }, style: { background: '#f8fafc', fontWeight: 'bold', width: 160 } },
    { id: 'google-sheet', position: { x: 50, y: 50 }, data: { label: '📊 Google Sheet' }, style: { background: '#f1f5f9', width: 160, height: 50, textAlign: 'center' } },

    // Abacus Platform
    { id: 'platform-label', position: { x: 300, y: 0 }, data: { label: 'ABACUS PLATFORM' }, style: { background: '#e0f2fe', fontWeight: 'bold', width: 160 } },
    { id: 'ai-mapper', position: { x: 300, y: 60 }, data: { label: '🤖 AI Column Mapper' }, style: { background: '#bae6fd', width: 160 } },
    { id: 'sync-engine', position: { x: 300, y: 120 }, data: { label: '🔄 Sync Engine' }, style: { background: '#bae6fd', width: 160 } },
    { id: 'database', position: { x: 300, y: 180 }, data: { label: '💾 Your Data' }, style: { background: '#bae6fd', width: 160 } },

    // Outputs
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
// 5. FEATURE MAP
// ============================================================================

export const featureMap = {
  nodes: [
    // Center
    { id: 'features', position: { x: 400, y: 250 }, data: { label: 'Abacus Features' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 150, textAlign: 'center' } },

    // Portfolio Dashboard
    { id: 'dashboard', position: { x: 100, y: 50 }, data: { label: '📊 Portfolio Dashboard' }, style: { background: '#e0f2fe', fontWeight: 'bold', width: 170 } },
    { id: 'dash-1', position: { x: 0, y: 100 }, data: { label: 'Summary Cards' }, style: { background: '#f0f9ff', width: 130 } },
    { id: 'dash-2', position: { x: 0, y: 140 }, data: { label: 'Merchant Table' }, style: { background: '#f0f9ff', width: 130 } },
    { id: 'dash-3', position: { x: 0, y: 180 }, data: { label: 'Deal Details' }, style: { background: '#f0f9ff', width: 130 } },
    { id: 'dash-4', position: { x: 140, y: 100 }, data: { label: 'Search & Filter' }, style: { background: '#f0f9ff', width: 130 } },
    { id: 'dash-5', position: { x: 140, y: 140 }, data: { label: 'Trend Charts' }, style: { background: '#f0f9ff', width: 130 } },

    // Merchant Portal
    { id: 'portal', position: { x: 400, y: 50 }, data: { label: '🏪 Merchant Portal' }, style: { background: '#dcfce7', fontWeight: 'bold', width: 160 } },
    { id: 'portal-1', position: { x: 320, y: 100 }, data: { label: 'Balance View' }, style: { background: '#f0fdf4', width: 120 } },
    { id: 'portal-2', position: { x: 320, y: 140 }, data: { label: 'Payment History' }, style: { background: '#f0fdf4', width: 120 } },
    { id: 'portal-3', position: { x: 450, y: 100 }, data: { label: 'Make Payments' }, style: { background: '#f0fdf4', width: 120 } },
    { id: 'portal-4', position: { x: 450, y: 140 }, data: { label: 'Request Payoff' }, style: { background: '#f0fdf4', width: 120 } },

    // Collections
    { id: 'collections', position: { x: 700, y: 50 }, data: { label: '📞 Collections Console' }, style: { background: '#fef3c7', fontWeight: 'bold', width: 170 } },
    { id: 'coll-1', position: { x: 620, y: 100 }, data: { label: 'Risk Scoring' }, style: { background: '#fefce8', width: 130 } },
    { id: 'coll-2', position: { x: 620, y: 140 }, data: { label: 'Priority Queue' }, style: { background: '#fefce8', width: 130 } },
    { id: 'coll-3', position: { x: 760, y: 100 }, data: { label: 'Notes & Follow-ups' }, style: { background: '#fefce8', width: 130 } },
    { id: 'coll-4', position: { x: 760, y: 140 }, data: { label: 'Team Assignment' }, style: { background: '#fefce8', width: 130 } },

    // Letters
    { id: 'letters', position: { x: 100, y: 350 }, data: { label: '📄 Letter Generation' }, style: { background: '#f3e8ff', fontWeight: 'bold', width: 160 } },
    { id: 'let-1', position: { x: 20, y: 400 }, data: { label: 'Payoff Letters' }, style: { background: '#faf5ff', width: 120 } },
    { id: 'let-2', position: { x: 150, y: 400 }, data: { label: 'Zero Balance' }, style: { background: '#faf5ff', width: 120 } },
    { id: 'let-3', position: { x: 85, y: 440 }, data: { label: 'Renewal Letters' }, style: { background: '#faf5ff', width: 120 } },

    // Alerts
    { id: 'alerts', position: { x: 400, y: 350 }, data: { label: '🔔 Alerts & Intelligence' }, style: { background: '#fee2e2', fontWeight: 'bold', width: 180 } },
    { id: 'alert-1', position: { x: 320, y: 400 }, data: { label: 'NSF Alerts' }, style: { background: '#fef2f2', width: 120 } },
    { id: 'alert-2', position: { x: 450, y: 400 }, data: { label: 'Late Alerts' }, style: { background: '#fef2f2', width: 120 } },
    { id: 'alert-3', position: { x: 320, y: 440 }, data: { label: 'Weekly Summary' }, style: { background: '#fef2f2', width: 120 } },
    { id: 'alert-4', position: { x: 450, y: 440 }, data: { label: 'AI Insights' }, style: { background: '#fef2f2', width: 120 } },

    // Sync
    { id: 'sync', position: { x: 700, y: 350 }, data: { label: '🔄 Google Sheets Sync' }, style: { background: '#dbeafe', fontWeight: 'bold', width: 170 } },
    { id: 'sync-1', position: { x: 620, y: 400 }, data: { label: 'Bi-directional' }, style: { background: '#eff6ff', width: 130 } },
    { id: 'sync-2', position: { x: 760, y: 400 }, data: { label: 'AI Column Mapping' }, style: { background: '#eff6ff', width: 130 } },
    { id: 'sync-3', position: { x: 690, y: 440 }, data: { label: 'Real-time Updates' }, style: { background: '#eff6ff', width: 130 } },
  ] as Node[],

  edges: [
    // Dashboard
    { id: 'e-f-dash', source: 'features', target: 'dashboard', type: 'smoothstep' },
    { id: 'e-dash-1', source: 'dashboard', target: 'dash-1', type: 'smoothstep' },
    { id: 'e-dash-2', source: 'dashboard', target: 'dash-2', type: 'smoothstep' },
    { id: 'e-dash-3', source: 'dashboard', target: 'dash-3', type: 'smoothstep' },
    { id: 'e-dash-4', source: 'dashboard', target: 'dash-4', type: 'smoothstep' },
    { id: 'e-dash-5', source: 'dashboard', target: 'dash-5', type: 'smoothstep' },

    // Portal
    { id: 'e-f-portal', source: 'features', target: 'portal', type: 'smoothstep' },
    { id: 'e-portal-1', source: 'portal', target: 'portal-1', type: 'smoothstep' },
    { id: 'e-portal-2', source: 'portal', target: 'portal-2', type: 'smoothstep' },
    { id: 'e-portal-3', source: 'portal', target: 'portal-3', type: 'smoothstep' },
    { id: 'e-portal-4', source: 'portal', target: 'portal-4', type: 'smoothstep' },

    // Collections
    { id: 'e-f-coll', source: 'features', target: 'collections', type: 'smoothstep' },
    { id: 'e-coll-1', source: 'collections', target: 'coll-1', type: 'smoothstep' },
    { id: 'e-coll-2', source: 'collections', target: 'coll-2', type: 'smoothstep' },
    { id: 'e-coll-3', source: 'collections', target: 'coll-3', type: 'smoothstep' },
    { id: 'e-coll-4', source: 'collections', target: 'coll-4', type: 'smoothstep' },

    // Letters
    { id: 'e-f-let', source: 'features', target: 'letters', type: 'smoothstep' },
    { id: 'e-let-1', source: 'letters', target: 'let-1', type: 'smoothstep' },
    { id: 'e-let-2', source: 'letters', target: 'let-2', type: 'smoothstep' },
    { id: 'e-let-3', source: 'letters', target: 'let-3', type: 'smoothstep' },

    // Alerts
    { id: 'e-f-alert', source: 'features', target: 'alerts', type: 'smoothstep' },
    { id: 'e-alert-1', source: 'alerts', target: 'alert-1', type: 'smoothstep' },
    { id: 'e-alert-2', source: 'alerts', target: 'alert-2', type: 'smoothstep' },
    { id: 'e-alert-3', source: 'alerts', target: 'alert-3', type: 'smoothstep' },
    { id: 'e-alert-4', source: 'alerts', target: 'alert-4', type: 'smoothstep' },

    // Sync
    { id: 'e-f-sync', source: 'features', target: 'sync', type: 'smoothstep' },
    { id: 'e-sync-1', source: 'sync', target: 'sync-1', type: 'smoothstep' },
    { id: 'e-sync-2', source: 'sync', target: 'sync-2', type: 'smoothstep' },
    { id: 'e-sync-3', source: 'sync', target: 'sync-3', type: 'smoothstep' },
  ] as Edge[],
};


// ============================================================================
// 6. MERCHANT STATUS STATE MACHINE
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
// 7. COLLECTIONS WORKFLOW
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
// 8. RISK SCORING
// ============================================================================

export const riskScoring = {
  nodes: [
    { id: 'title', position: { x: 200, y: 0 }, data: { label: 'RISK SCORE (0-100)' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 200, textAlign: 'center' } },

    // Factors
    { id: 'factors-label', position: { x: 0, y: 60 }, data: { label: 'SCORING FACTORS' }, style: { background: '#f1f5f9', fontWeight: 'bold', width: 150 } },
    { id: 'nsf-7d', position: { x: 0, y: 110 }, data: { label: 'NSF (7-day): 30 pts max' }, style: { background: '#fee2e2', width: 180 } },
    { id: 'dpd', position: { x: 0, y: 150 }, data: { label: 'Days Past Due: 30 pts max' }, style: { background: '#fee2e2', width: 180 } },
    { id: 'nsf-total', position: { x: 0, y: 190 }, data: { label: 'Total NSF: 20 pts max' }, style: { background: '#fef3c7', width: 180 } },
    { id: 'late-7d', position: { x: 0, y: 230 }, data: { label: 'Late (7-day): 20 pts max' }, style: { background: '#fef3c7', width: 180 } },

    // Risk Levels
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
// 9. USER ROLES
// ============================================================================

export const userRoles = {
  nodes: [
    { id: 'roles-title', position: { x: 250, y: 0 }, data: { label: 'USER ROLES' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 150, textAlign: 'center' } },

    // Admin
    { id: 'admin', position: { x: 0, y: 80 }, data: { label: '👑 ADMIN' }, style: { background: '#8b5cf6', color: 'white', fontWeight: 'bold', width: 140, textAlign: 'center' } },
    { id: 'admin-1', position: { x: 0, y: 130 }, data: { label: 'Full dashboard access' }, style: { background: '#f3e8ff', width: 140 } },
    { id: 'admin-2', position: { x: 0, y: 165 }, data: { label: 'Manage all deals' }, style: { background: '#f3e8ff', width: 140 } },
    { id: 'admin-3', position: { x: 0, y: 200 }, data: { label: 'Configure settings' }, style: { background: '#f3e8ff', width: 140 } },
    { id: 'admin-4', position: { x: 0, y: 235 }, data: { label: 'Manage users' }, style: { background: '#f3e8ff', width: 140 } },
    { id: 'admin-5', position: { x: 0, y: 270 }, data: { label: 'Generate any letter' }, style: { background: '#f3e8ff', width: 140 } },

    // Rep
    { id: 'rep', position: { x: 200, y: 80 }, data: { label: '👤 REP' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 140, textAlign: 'center' } },
    { id: 'rep-1', position: { x: 200, y: 130 }, data: { label: 'View assigned deals' }, style: { background: '#e0f2fe', width: 140 } },
    { id: 'rep-2', position: { x: 200, y: 165 }, data: { label: 'Collections access' }, style: { background: '#e0f2fe', width: 140 } },
    { id: 'rep-3', position: { x: 200, y: 200 }, data: { label: 'Log notes' }, style: { background: '#e0f2fe', width: 140 } },
    { id: 'rep-4', position: { x: 200, y: 235 }, data: { label: 'Generate letters' }, style: { background: '#e0f2fe', width: 140 } },

    // Merchant
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

    // Hierarchy arrows
    { id: 'e-admin-rep', source: 'admin', target: 'rep', style: { stroke: '#cbd5e1', strokeDasharray: '5,5' } },
    { id: 'e-rep-merch', source: 'rep', target: 'merchant', style: { stroke: '#cbd5e1', strokeDasharray: '5,5' } },
  ] as Edge[],
};


// ============================================================================
// 10. TECHNICAL ARCHITECTURE
// ============================================================================

export const techArchitecture = {
  nodes: [
    // Your Data
    { id: 'your-data-label', position: { x: 0, y: 100 }, data: { label: 'YOUR DATA' }, style: { background: '#f8fafc', fontWeight: 'bold', width: 120 } },
    { id: 'google-sheet', position: { x: 0, y: 150 }, data: { label: '📊 Google Sheet' }, style: { background: '#f1f5f9', width: 120 } },

    // Abacus Core
    { id: 'abacus-label', position: { x: 180, y: 50 }, data: { label: 'ABACUS' }, style: { background: '#e0f2fe', fontWeight: 'bold', width: 200 } },
    { id: 'ai', position: { x: 180, y: 100 }, data: { label: '🤖 AI Mapping' }, style: { background: '#bae6fd', width: 100 } },
    { id: 'sync', position: { x: 280, y: 100 }, data: { label: '🔄 Sync Engine' }, style: { background: '#bae6fd', width: 100 } },
    { id: 'db', position: { x: 180, y: 150 }, data: { label: '💾 Database' }, style: { background: '#bae6fd', width: 100 } },
    { id: 'app', position: { x: 280, y: 150 }, data: { label: '🖥️ Web App' }, style: { background: '#bae6fd', width: 100 } },

    // Users
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
// 11. MERCHANT PORTAL
// ============================================================================

export const merchantPortal = {
  nodes: [
    { id: 'title', position: { x: 200, y: 0 }, data: { label: 'MERCHANT PORTAL\n(The "$50K Feature")' }, style: { background: '#16a34a', color: 'white', fontWeight: 'bold', width: 200, height: 50, textAlign: 'center' } },

    // Features
    { id: 'features-label', position: { x: 0, y: 80 }, data: { label: 'WHAT MERCHANTS GET' }, style: { background: '#dcfce7', fontWeight: 'bold', width: 180 } },

    { id: 'balance', position: { x: 0, y: 130 }, data: { label: '💰 Balance View\nSee current balance' }, style: { background: '#f0fdf4', width: 150, height: 50, textAlign: 'center' } },
    { id: 'history', position: { x: 170, y: 130 }, data: { label: '📋 Payment History\nFull ledger with dates' }, style: { background: '#f0fdf4', width: 150, height: 50, textAlign: 'center' } },
    { id: 'payoff', position: { x: 340, y: 130 }, data: { label: '📄 Request Payoff\nGet letter instantly' }, style: { background: '#f0fdf4', width: 150, height: 50, textAlign: 'center' } },
    { id: 'pay', position: { x: 510, y: 130 }, data: { label: '💳 Make Payment\nPay online instantly' }, style: { background: '#f0fdf4', width: 150, height: 50, textAlign: 'center' } },

    // Why it matters
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
// 12. WEBSITE BRANDING SCRAPER
// ============================================================================

export const websiteBrandingScraper = {
  nodes: [
    { id: 'title', position: { x: 250, y: 0 }, data: { label: '🌐 AUTO-BRANDING FROM WEBSITE' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 250, textAlign: 'center' } },

    // Input
    { id: 'input', position: { x: 250, y: 70 }, data: { label: '🔗 Enter Your Website URL\nhonestfunding.com' }, style: { background: '#f8fafc', width: 200, height: 50, textAlign: 'center', border: '2px dashed #cbd5e1' } },

    // AI Scraper
    { id: 'scraper', position: { x: 250, y: 160 }, data: { label: '🤖 AI Website Analyzer' }, style: { background: '#8b5cf6', color: 'white', fontWeight: 'bold', width: 200, textAlign: 'center' } },

    // What We Extract
    { id: 'extract-label', position: { x: 0, y: 240 }, data: { label: 'WHAT WE EXTRACT' }, style: { background: '#e0f2fe', fontWeight: 'bold', width: 160 } },

    { id: 'logo', position: { x: 0, y: 290 }, data: { label: '🖼️ Logo\nAuto-detect from header/favicon' }, style: { background: '#f0f9ff', width: 180, height: 50, textAlign: 'center' } },
    { id: 'colors', position: { x: 0, y: 360 }, data: { label: '🎨 Color Scheme\nPrimary & secondary colors' }, style: { background: '#f0f9ff', width: 180, height: 50, textAlign: 'center' } },
    { id: 'company', position: { x: 0, y: 430 }, data: { label: '🏢 Company Name\nFrom title/meta/footer' }, style: { background: '#f0f9ff', width: 180, height: 50, textAlign: 'center' } },
    { id: 'address', position: { x: 0, y: 500 }, data: { label: '📍 Address\nFrom contact/footer' }, style: { background: '#f0f9ff', width: 180, height: 50, textAlign: 'center' } },
    { id: 'contact', position: { x: 0, y: 570 }, data: { label: '📞 Contact Info\nPhone, email, support' }, style: { background: '#f0f9ff', width: 180, height: 50, textAlign: 'center' } },

    // Where It Goes
    { id: 'populate-label', position: { x: 450, y: 240 }, data: { label: 'AUTO-POPULATES' }, style: { background: '#dcfce7', fontWeight: 'bold', width: 160 } },

    { id: 'portal-brand', position: { x: 450, y: 290 }, data: { label: '🏪 Merchant Portal\nLogo, colors, name' }, style: { background: '#f0fdf4', width: 180, height: 50, textAlign: 'center' } },
    { id: 'letters', position: { x: 450, y: 360 }, data: { label: '📄 Letter Templates\nLetterhead, footer, signature' }, style: { background: '#f0fdf4', width: 180, height: 50, textAlign: 'center' } },
    { id: 'emails', position: { x: 450, y: 430 }, data: { label: '📧 Email Templates\nFrom name, branding' }, style: { background: '#f0fdf4', width: 180, height: 50, textAlign: 'center' } },
    { id: 'dashboard', position: { x: 450, y: 500 }, data: { label: '📊 Dashboard\nCompany name, theme' }, style: { background: '#f0fdf4', width: 180, height: 50, textAlign: 'center' } },
    { id: 'pdfs', position: { x: 450, y: 570 }, data: { label: '📑 PDF Exports\nBranded headers/footers' }, style: { background: '#f0fdf4', width: 180, height: 50, textAlign: 'center' } },

    // Result
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

    // Cross connections showing data flow
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
// 13. ENHANCED ONBOARDING FLOW (with Website Scraping)
// ============================================================================

export const enhancedOnboardingFlow = {
  nodes: [
    // Row 1: Setup
    { id: 'step1', position: { x: 0, y: 0 }, data: { label: '1. Enter Website\nhonestfunding.com' }, style: { background: '#8b5cf6', color: 'white', width: 150, height: 60, textAlign: 'center' } },
    { id: 'step2', position: { x: 200, y: 0 }, data: { label: '2. AI Scrapes\nLogo, Colors, Info' }, style: { background: '#8b5cf6', color: 'white', width: 150, height: 60, textAlign: 'center' } },
    { id: 'step3', position: { x: 400, y: 0 }, data: { label: '3. Connect\nGoogle Sheet' }, style: { background: '#f8fafc', width: 150, height: 60, textAlign: 'center' } },

    // Row 2: Data
    { id: 'step4', position: { x: 0, y: 120 }, data: { label: '4. AI Analyzes\nYour Columns' }, style: { background: '#0ea5e9', color: 'white', width: 150, height: 60, textAlign: 'center' } },
    { id: 'step5', position: { x: 200, y: 120 }, data: { label: '5. Confirm\nMappings' }, style: { background: '#22c55e', color: 'white', width: 150, height: 60, textAlign: 'center' } },
    { id: 'step6', position: { x: 400, y: 120 }, data: { label: '6. First Sync\nRuns' }, style: { background: '#f97316', color: 'white', width: 150, height: 60, textAlign: 'center' } },

    // Final
    { id: 'done', position: { x: 200, y: 240 }, data: { label: '🎉 READY!\nBranded Dashboard\nMerchant Portal\nLetter Templates' }, style: { background: '#16a34a', color: 'white', fontWeight: 'bold', width: 180, height: 80, textAlign: 'center' } },

    // Time indicator
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
// 14. BRANDING DATA MODEL
// ============================================================================

export const brandingDataModel = {
  nodes: [
    { id: 'title', position: { x: 200, y: 0 }, data: { label: 'BRANDING CONFIGURATION' }, style: { background: '#0ea5e9', color: 'white', fontWeight: 'bold', width: 220, textAlign: 'center' } },

    // Source
    { id: 'source', position: { x: 0, y: 80 }, data: { label: '🌐 Website URL' }, style: { background: '#f8fafc', fontWeight: 'bold', width: 140 } },

    // Extracted Data
    { id: 'extracted', position: { x: 200, y: 80 }, data: { label: 'AI EXTRACTED' }, style: { background: '#f3e8ff', fontWeight: 'bold', width: 140 } },

    { id: 'logo-url', position: { x: 100, y: 140 }, data: { label: 'logo_url\n(PNG/SVG)' }, style: { background: '#faf5ff', width: 100, height: 50, textAlign: 'center', fontSize: 11 } },
    { id: 'primary-color', position: { x: 210, y: 140 }, data: { label: 'primary_color\n#0ea5e9' }, style: { background: '#faf5ff', width: 100, height: 50, textAlign: 'center', fontSize: 11 } },
    { id: 'secondary-color', position: { x: 320, y: 140 }, data: { label: 'secondary_color\n#f97316' }, style: { background: '#faf5ff', width: 100, height: 50, textAlign: 'center', fontSize: 11 } },

    { id: 'company-name', position: { x: 100, y: 210 }, data: { label: 'company_name\n"Honest Funding"' }, style: { background: '#faf5ff', width: 110, height: 50, textAlign: 'center', fontSize: 11 } },
    { id: 'address', position: { x: 220, y: 210 }, data: { label: 'address\n"123 Main St..."' }, style: { background: '#faf5ff', width: 100, height: 50, textAlign: 'center', fontSize: 11 } },
    { id: 'phone', position: { x: 330, y: 210 }, data: { label: 'phone\n"(555) 123-4567"' }, style: { background: '#faf5ff', width: 100, height: 50, textAlign: 'center', fontSize: 11 } },

    { id: 'email', position: { x: 150, y: 280 }, data: { label: 'support_email\n"support@..."' }, style: { background: '#faf5ff', width: 110, height: 50, textAlign: 'center', fontSize: 11 } },
    { id: 'tagline', position: { x: 270, y: 280 }, data: { label: 'tagline\n"Funding Made..."' }, style: { background: '#faf5ff', width: 110, height: 50, textAlign: 'center', fontSize: 11 } },

    // Output destinations
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

export const allDiagrams = {
  coreIdentity,
  threePillars,
  onboardingFlow,
  enhancedOnboardingFlow,
  dataFlow,
  featureMap,
  statusStateMachine,
  collectionsWorkflow,
  riskScoring,
  userRoles,
  techArchitecture,
  merchantPortal,
  websiteBrandingScraper,
  brandingDataModel,
};

export default allDiagrams;
