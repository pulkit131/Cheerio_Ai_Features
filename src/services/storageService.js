import {
  defaultBusiness,
  defaultCampaignConfig,
  defaultMissionConfig,
  defaultMissionState,
  defaultSettings,
  missionCatalog,
  seedActivity,
  simulatedCampaigns,
} from '../data/demoData.js'

export const STORAGE_KEY = 'cheerio-growth-missions:v1'

export function buildDefaultState() {
  const missions = Object.fromEntries(
    missionCatalog.map((mission) => [mission.id, { ...defaultMissionState }]),
  )

  return {
    version: 1,
    business: { ...defaultBusiness },
    settings: {
      ...defaultSettings,
      recommendationPreferences: { ...defaultSettings.recommendationPreferences },
      integrations: Object.fromEntries(
        Object.entries(defaultSettings.integrations).map(([id, integration]) => [id, { ...integration }]),
      ),
    },
    missions,
    missionConfig: Object.fromEntries(missionCatalog.map((mission) => [
      mission.id,
      mission.id === 'campaign-performance'
        ? { ...defaultCampaignConfig }
        : { ...defaultMissionConfig },
    ])),
    activity: [...seedActivity],
    recommendations: [],
    metrics: {
      lastActivatedMissionId: null,
      currentDemoStart: new Date().toISOString(),
    },
  }
}

function mergeWithDefaults(rawState) {
  const defaults = buildDefaultState()
  const business = rawState.business && typeof rawState.business === 'object' ? rawState.business : {}
  const rawSettings = rawState.settings && typeof rawState.settings === 'object' ? rawState.settings : {}
  const rawMissions = rawState.missions && typeof rawState.missions === 'object' ? rawState.missions : {}
  const rawMissionConfig = rawState.missionConfig && typeof rawState.missionConfig === 'object' ? rawState.missionConfig : {}
  const activityItems = Array.isArray(rawState.activity)
    ? rawState.activity.filter((event) => (
      event
      && typeof event === 'object'
      && typeof event.eventName === 'string'
      && event.eventName.trim()
      && typeof event.timestamp === 'string'
      && !Number.isNaN(Date.parse(event.timestamp))
    ))
    : defaults.activity
  const seenEventKeys = new Set()
  const activity = activityItems.filter((event) => {
    const key = event.dedupeKey || event.id
    if (!key) return true
    if (seenEventKeys.has(key)) return false
    seenEventKeys.add(key)
    return true
  }).map((event) => ({
    ...event,
    properties: event.properties && typeof event.properties === 'object' && !Array.isArray(event.properties)
      ? event.properties
      : {},
    category: typeof event.category === 'string' ? event.category : 'Journey',
    eventSource: typeof event.eventSource === 'string' ? event.eventSource : 'current-demo',
  }))
  const merged = {
    ...defaults,
    ...rawState,
    business: { ...defaults.business, ...business },
    settings: {
      ...defaults.settings,
      ...rawSettings,
      recommendationPreferences: {
        ...defaults.settings.recommendationPreferences,
        ...(rawSettings.recommendationPreferences || {}),
      },
      integrations: {
        ...defaults.settings.integrations,
        ...(rawSettings.integrations || {}),
      },
      theme: rawSettings.theme === 'dark' ? 'dark' : 'light',
      audienceSize: Number.isInteger(rawSettings.audienceSize) && rawSettings.audienceSize >= 0 && rawSettings.audienceSize <= 1000000
        ? rawSettings.audienceSize
        : defaults.settings.audienceSize,
      templateApproval: ['approved', 'pending'].includes(rawSettings.templateApproval)
        ? rawSettings.templateApproval
        : defaults.settings.templateApproval,
    },
    recommendations: Array.isArray(rawState.recommendations) ? rawState.recommendations : [],
    activity,
    metrics: { ...defaults.metrics, ...(rawState.metrics || {}) },
  }
  if (!['sales_recovery', 'repeat_purchases', 'campaign_performance'].includes(merged.business.goal)) {
    merged.business.goal = defaults.business.goal
  }
  if (typeof merged.business.category !== 'string') merged.business.category = defaults.business.category
  if (typeof merged.business.channel !== 'string') merged.business.channel = defaults.business.channel
  for (const preference of Object.keys(defaults.settings.recommendationPreferences)) {
    merged.settings.recommendationPreferences[preference] = typeof rawSettings.recommendationPreferences?.[preference] === 'boolean'
      ? rawSettings.recommendationPreferences[preference]
      : defaults.settings.recommendationPreferences[preference]
  }
  merged.settings.businessGoal = merged.business.goal
  merged.settings.businessCategory = merged.business.category
  merged.settings.communicationChannel = merged.business.channel

  const missionIds = missionCatalog.map((mission) => mission.id)
  merged.missions = Object.fromEntries(
    missionIds.map((missionId) => [
      missionId,
      {
        ...defaults.missions[missionId],
        ...(rawMissions[missionId] && typeof rawMissions[missionId] === 'object' ? rawMissions[missionId] : {}),
      },
    ]),
  )

  merged.missionConfig = Object.fromEntries(
    missionIds.map((missionId) => [
      missionId,
      {
        ...defaults.missionConfig[missionId],
        ...(rawMissionConfig[missionId] && typeof rawMissionConfig[missionId] === 'object' ? rawMissionConfig[missionId] : {}),
      },
    ]),
  )

  for (const integrationId of Object.keys(defaults.settings.integrations)) {
    const savedIntegration = rawSettings.integrations?.[integrationId]
    merged.settings.integrations[integrationId] = {
      ...defaults.settings.integrations[integrationId],
      ...(savedIntegration && typeof savedIntegration === 'object'
        ? savedIntegration
        : {}),
      connected: typeof savedIntegration?.connected === 'boolean'
        ? savedIntegration.connected
        : defaults.settings.integrations[integrationId].connected,
    }
  }

  for (const missionId of missionIds) {
    const mission = merged.missions[missionId]
    if (!['not_started', 'in_progress', 'completed'].includes(mission.status)) {
      mission.status = defaults.missions[missionId].status
    }
    mission.progress = Number.isFinite(mission.progress)
      ? Math.min(100, Math.max(0, mission.progress))
      : defaults.missions[missionId].progress
    for (const field of ['startedAt', 'setupCompletedAt', 'completedAt', 'activatedAt']) {
      if (typeof mission[field] !== 'string' || Number.isNaN(Date.parse(mission[field]))) mission[field] = null
    }
    const config = merged.missionConfig[missionId]
    const maximumStep = missionId === 'campaign-performance' ? 3 : 6
    config.currentStep = Number.isInteger(config.currentStep)
      ? Math.min(maximumStep, Math.max(0, config.currentStep))
      : 0
    for (const field of ['message', 'campaignId', 'observation', 'nextAction']) {
      if (config[field] !== undefined && typeof config[field] !== 'string') delete config[field]
    }
    if (missionId === 'campaign-performance' && !simulatedCampaigns.some((campaign) => campaign.id === config.campaignId)) {
      config.campaignId = defaultCampaignConfig.campaignId
    }
    if (typeof config.reviewConfirmed !== 'boolean') config.reviewConfirmed = false

    if (mission.completedAt || mission.setupCompletedAt || mission.activatedAt) {
      merged.missions[missionId] = {
        ...mission,
        status: 'completed',
        progress: 100,
        completedAt: mission.completedAt || mission.setupCompletedAt || mission.activatedAt,
        setupCompletedAt: mission.setupCompletedAt || mission.completedAt || mission.activatedAt,
      }
    } else if (mission.status === 'completed') {
      const completedAt = mission.completedAt || mission.startedAt
      merged.missions[missionId] = completedAt
        ? { ...mission, completedAt, setupCompletedAt: completedAt, progress: 100 }
        : { ...mission, ...defaults.missions[missionId] }
    }
  }

  return merged
}

export function loadPersistedState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return buildDefaultState()
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return buildDefaultState()
    return mergeWithDefaults(parsed)
  } catch (error) {
    console.warn('Falling back to default demo data due to malformed localStorage state.', error)
    return buildDefaultState()
  }
}

export function persistState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.warn('Unable to persist local demo state.', error)
  }
}
