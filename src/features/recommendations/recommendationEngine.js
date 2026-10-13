import { missionCatalog } from '../../data/demoData.js'

const goalMissionOrder = {
  sales_recovery: ['abandoned-cart', 'campaign-performance', 'repeat-purchase', 'inactive-customers'],
  repeat_purchases: ['repeat-purchase', 'inactive-customers', 'abandoned-cart', 'campaign-performance'],
  campaign_performance: ['campaign-performance', 'abandoned-cart', 'repeat-purchase', 'inactive-customers'],
}

const missionPreference = {
  'abandoned-cart': 'salesRecovery',
  'campaign-performance': 'analytics',
  'repeat-purchase': 'segmentation',
  'inactive-customers': 'retention',
}

const rationaleByMission = {
  'abandoned-cart': 'GlowCart runs WhatsApp campaigns, and a cart recovery sequence is not yet configured in this demo.',
  'campaign-performance': 'Comparing simulated campaign results gives GlowCart a data-backed next optimization.',
  'repeat-purchase': 'Purchase-based customer segments can make follow-up more relevant.',
  'inactive-customers': 'A timed message can re-engage customers who have gone quiet.',
}

const goalLabel = {
  sales_recovery: 'recovering lost sales',
  repeat_purchases: 'growing repeat purchases',
  campaign_performance: 'improving campaign performance',
}

export function getRecommendedMission(state) {
  if (!state?.business || !state?.missions) return null

  const goalOrder = goalMissionOrder[state.business.goal] || goalMissionOrder.sales_recovery
  const orderedIds = [...new Set([...goalOrder, ...missionCatalog.map((mission) => mission.id)])]
  const missionId = orderedIds.find((id) => (
    state.missions[id]
    && state.missions[id].status !== 'completed'
    && !state.missions[id].completedAt
    && !state.missions[id].setupCompletedAt
    && !state.missions[id].activatedAt
    && state.settings?.recommendationPreferences?.[missionPreference[id]] !== false
  ))

  if (!missionId) return null

  const mission = state.missions[missionId]
  const definition = missionCatalog.find((item) => item.id === missionId)
  const goalMatches = goalOrder[0] === missionId
  const isInProgress = mission.status === 'in_progress'
  const readiness = getRecommendationReadiness(missionId, state.settings)
  const readinessNote = readiness.missingPrerequisites.length
    ? ` Demo prerequisite needs attention: ${readiness.missingPrerequisites.join(', ')}.`
    : ''
  const rationale = isInProgress
    ? `Continue the mission already in progress. ${rationaleByMission[missionId]}`
    : goalMatches
      ? `This mission aligns with your goal of ${goalLabel[state.business.goal] || 'business growth'}. ${rationaleByMission[missionId]}`
      : `This is the next available mission for your current workspace. ${rationaleByMission[missionId]}`

  return {
    id: missionId,
    title: definition?.title || getTitle(missionId),
    rationale: `${rationale}${readinessNote}`,
    reasonCodes: [goalMatches ? 'goal_match' : 'next_available_opportunity', ...(isInProgress ? ['in_progress'] : [])],
    capabilities: getCapabilities(missionId),
    prerequisites: definition?.prerequisites || [],
    effort: definition?.effort || '5 minutes',
    priority: goalMatches ? 97 : 78,
    nextAction: isInProgress ? 'Continue mission' : 'Start mission',
    readiness: readiness.status,
    missingPrerequisites: readiness.missingPrerequisites,
  }
}

function getTitle(missionId) {
  const titles = {
    'abandoned-cart': 'Recover more abandoned carts',
    'campaign-performance': 'Understand campaign performance',
    'repeat-purchase': 'Create a repeat-purchase segment',
    'inactive-customers': 'Re-engage inactive customers',
  }
  return titles[missionId] || missionId
}

function getCapabilities(missionId) {
  const capabilities = {
    'abandoned-cart': ['WhatsApp campaigns', 'Audience targeting', 'Message timing'],
    'campaign-performance': ['Campaign analytics', 'Performance review', 'Optimization planning'],
    'repeat-purchase': ['Customer segmentation', 'CRM logic', 'Follow-up flows'],
    'inactive-customers': ['Customer segmentation', 'WhatsApp follow-up'],
  }
  return capabilities[missionId] || []
}

export function getRecommendationReadiness(missionId, settings = {}) {
  const checks = {
    'abandoned-cart': [
      ['WhatsApp connection', Boolean(settings.integrations?.whatsapp?.connected)],
      ['eligible audience', Number.isInteger(settings.audienceSize) && settings.audienceSize > 0],
      ['template approval', settings.templateApproval === 'approved'],
    ],
    'campaign-performance': [
      ['campaign analytics connection', Boolean(settings.integrations?.analytics?.connected)],
    ],
    'repeat-purchase': [
      ['CRM connection', Boolean(settings.integrations?.crm?.connected)],
      ['eligible audience', Number.isInteger(settings.audienceSize) && settings.audienceSize > 0],
    ],
    'inactive-customers': [
      ['CRM connection', Boolean(settings.integrations?.crm?.connected)],
      ['eligible audience', Number.isInteger(settings.audienceSize) && settings.audienceSize > 0],
    ],
  }[missionId] || []
  const missingPrerequisites = checks.filter(([, ready]) => !ready).map(([label]) => label)
  return {
    status: missingPrerequisites.length ? 'needs_attention' : 'ready',
    missingPrerequisites,
  }
}
