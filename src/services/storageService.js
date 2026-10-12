import { defaultBusiness, defaultMissionConfig, defaultMissionState, defaultSettings, missionCatalog, seedActivity } from '../data/demoData.js'

export const STORAGE_KEY = 'cheerio-growth-missions:v1'

export function buildDefaultState() {
  const missions = Object.fromEntries(
    missionCatalog.map((mission) => [mission.id, { ...defaultMissionState, status: mission.id === 'abandoned-cart' ? 'in_progress' : 'not_started', progress: mission.id === 'abandoned-cart' ? 28 : 0 }]),
  )

  return {
    version: 1,
    business: { ...defaultBusiness },
    settings: { ...defaultSettings },
    missions,
    missionConfig: Object.fromEntries(missionCatalog.map((mission) => [mission.id, { ...defaultMissionConfig, currentStep: 0 }])),
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
  const merged = {
    ...defaults,
    ...rawState,
    business: { ...defaults.business, ...(rawState.business || {}) },
    settings: { ...defaults.settings, ...(rawState.settings || {}) },
    recommendations: Array.isArray(rawState.recommendations) ? rawState.recommendations : [],
    activity: Array.isArray(rawState.activity) ? rawState.activity : defaults.activity,
    metrics: { ...defaults.metrics, ...(rawState.metrics || {}) },
  }

  const missionIds = missionCatalog.map((mission) => mission.id)
  merged.missions = Object.fromEntries(
    missionIds.map((missionId) => [
      missionId,
      {
        ...defaults.missions[missionId],
        ...(rawState.missions?.[missionId] || {}),
      },
    ]),
  )

  merged.missionConfig = Object.fromEntries(
    missionIds.map((missionId) => [
      missionId,
      {
        ...defaults.missionConfig[missionId],
        ...(rawState.missionConfig?.[missionId] || {}),
      },
    ]),
  )

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
