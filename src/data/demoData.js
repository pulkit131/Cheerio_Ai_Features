export const missionCatalog = [
  {
    id: 'abandoned-cart',
    title: 'Recover abandoned carts',
    category: 'Sales recovery',
    description: 'Turn existing WhatsApp campaigns into a respectful, guided recovery journey for shoppers who leave without checking out.',
    outcome: 'Recover more lost sales and turn at-risk shoppers into repeat buyers.',
    prerequisites: ['WhatsApp connected', 'Customer list with cart activity', 'Message template approved'],
    effort: '5 minutes',
    status: 'Recommended',
    recommendedReason: 'Your current goal is sales recovery and GlowCart already sends WhatsApp campaigns.',
    setupSteps: ['Choose the trigger', 'Select the audience', 'Set timing', 'Create the message', 'Review and validate', 'Activate demo workflow'],
  },
  {
    id: 'inactive-customers',
    title: 'Re-engage inactive customers',
    category: 'Customer retention',
    description: 'Bring past buyers back with a timed message that feels relevant and low-pressure.',
    outcome: 'Recreate purchase intent from previously engaged customers.',
    prerequisites: ['Customer segment with last purchase date', 'Preferred reminder timing', 'A simple offer or update'],
    effort: '8 minutes',
    status: 'Not started',
    recommendedReason: 'A lighter, retention-focused opportunity can work after recovery is in place.',
    setupSteps: ['Pick the inactivity window', 'Create a segment', 'Choose the message', 'Review the sequence'],
  },
  {
    id: 'repeat-purchase',
    title: 'Create a repeat-purchase segment',
    category: 'Customer understanding',
    description: 'Group customers by purchase behavior so follow-up is smarter and more relevant.',
    outcome: 'Improve repeat-purchase efficiency through segmentation.',
    prerequisites: ['Purchase data available', 'Customer tags or purchase history', 'Consent for campaign targeting'],
    effort: '10 minutes',
    status: 'Needs attention',
    recommendedReason: 'The business goal is repeat purchase, and segmentation is a high-leverage next move.',
    setupSteps: ['Review purchases', 'Define the segment rule', 'Save the audience', 'Test the message'],
  },
  {
    id: 'campaign-performance',
    title: 'Understand campaign performance',
    category: 'Campaign performance',
    description: 'Learn what is working by looking at message engagement and purchase outcomes from your recent campaigns.',
    outcome: 'Identify the highest-performing campaigns to improve spend efficiency.',
    prerequisites: ['Recent campaign history', 'Message analytics enabled', 'Basic conversion tracking'],
    effort: '7 minutes',
    status: 'Not started',
    recommendedReason: 'The team has been sending campaigns manually, but performance data has not been translated into a follow-up optimization workflow yet.',
    setupSteps: ['Select a recent campaign', 'Review performance', 'Compare conversion', 'Document the next change'],
  },
]

export const defaultBusiness = {
  id: 'glowcart',
  name: 'GlowCart',
  category: 'Skincare • DTC',
  channel: 'WhatsApp',
  goal: 'sales_recovery',
}

export const defaultSettings = {
  theme: 'light',
  businessGoal: 'sales_recovery',
  businessCategory: 'Skincare • DTC',
  communicationChannel: 'WhatsApp',
  recommendationPreferences: {
    salesRecovery: true,
    retention: true,
    analytics: true,
    segmentation: true,
  },
  integrations: {
    whatsapp: { connected: true, label: 'WhatsApp Business' },
    crm: { connected: true, label: 'GlowCart CRM' },
    analytics: { connected: true, label: 'Campaign analytics' },
  },
  templateApproval: 'approved',
  audienceSize: 1264,
  lastUpdated: null,
}

export const defaultMissionConfig = {
  trigger: 'cart_abandonment',
  audience: 'all_eligible',
  timing: '2_hours',
  message: 'Hi {{first_name}}, you left something in your cart. Take another look when you\'re ready: {{cart_link}}',
  reviewConfirmed: false,
  currentStep: 0,
  lastSavedAt: null,
}

export const defaultMissionState = {
  status: 'not_started',
  progress: 0,
  startedAt: null,
  activatedAt: null,
  completedAt: null,
  openedAt: null,
}

export const seedActivity = [
  {
    id: 'seed-activity-1',
    eventName: 'Mission viewed',
    missionId: 'abandoned-cart',
    timestamp: '2025-04-07T09:10:00.000Z',
    eventSource: 'simulated-history',
    properties: { journey: 'discover' },
    category: 'Discovery',
    isHistorical: true,
  },
  {
    id: 'seed-activity-2',
    eventName: 'Recommendation dismissed',
    missionId: 'repeat-purchase',
    timestamp: '2025-04-09T13:45:00.000Z',
    eventSource: 'simulated-history',
    properties: { reason: 'later' },
    category: 'Recommendation',
    isHistorical: true,
  },
  {
    id: 'seed-activity-3',
    eventName: 'Mission started',
    missionId: 'campaign-performance',
    timestamp: '2025-04-11T16:30:00.000Z',
    eventSource: 'simulated-history',
    properties: { step: 'overview' },
    category: 'Journey',
    isHistorical: true,
  },
]

export const historicalInsights = [
  { name: 'Week 1', missionStarted: 14, setupCompleted: 12, readinessPassed: 9, activated: 6 },
  { name: 'Week 2', missionStarted: 18, setupCompleted: 15, readinessPassed: 11, activated: 8 },
  { name: 'Week 3', missionStarted: 24, setupCompleted: 19, readinessPassed: 15, activated: 11 },
  { name: 'Week 4', missionStarted: 28, setupCompleted: 22, readinessPassed: 17, activated: 12 },
]

export const funnelStages = [
  { name: 'Impression', value: 224 },
  { name: 'Started', value: 168 },
  { name: 'Setup', value: 111 },
  { name: 'Ready', value: 72 },
  { name: 'Activated', value: 48 },
  { name: 'Repeat usage', value: 29 },
]
