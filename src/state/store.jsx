import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { buildDefaultState, loadPersistedState, persistState } from '../services/storageService.js'
import { evaluateReadiness } from '../features/missions/missionValidation.js'

const StoreContext = createContext(null)

export function AppStateProvider({ children }) {
  const [state, setState] = useState(() => loadPersistedState())

  useEffect(() => {
    persistState(state)
  }, [state])

  const updateState = (updater) => {
    setState((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater
      return next
    })
  }

  const updateBusiness = (patch) => {
    setState((current) => ({
      ...current,
      business: { ...current.business, ...patch },
      settings: {
        ...current.settings,
        businessGoal: patch.goal ?? current.settings.businessGoal,
        businessCategory: patch.category ?? current.settings.businessCategory,
        communicationChannel: patch.channel ?? current.settings.communicationChannel,
      },
    }))
  }

  const updateSettings = (patch) => {
    setState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        ...patch,
        recommendationPreferences: {
          ...current.settings.recommendationPreferences,
          ...(patch.recommendationPreferences || {}),
        },
        integrations: {
          ...current.settings.integrations,
          ...(patch.integrations || {}),
        },
      },
      business: {
        ...current.business,
        goal: patch.businessGoal ?? current.business.goal,
        category: patch.businessCategory ?? current.business.category,
        channel: patch.communicationChannel ?? current.business.channel,
      },
    }))
  }

  const updateMissionConfig = (missionId, patch) => {
    setState((current) => ({
      ...current,
      missionConfig: {
        ...current.missionConfig,
        [missionId]: {
          ...current.missionConfig[missionId],
          ...patch,
          lastSavedAt: new Date().toISOString(),
        },
      },
    }))
  }

  const updateMissionState = (missionId, patch) => {
    setState((current) => ({
      ...current,
      missions: {
        ...current.missions,
        [missionId]: {
          ...current.missions[missionId],
          ...patch,
        },
      },
    }))
  }

  const addEvent = (event) => {
    setState((current) => {
      if (event.dedupeKey && current.activity.some((item) => item.dedupeKey === event.dedupeKey)) {
        return current
      }
      const nextEvent = {
        id: event.id || `event-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        dedupeKey: event.dedupeKey || null,
        eventName: event.eventName,
        missionId: event.missionId || null,
        timestamp: event.timestamp || new Date().toISOString(),
        eventSource: event.eventSource || 'current-demo',
        properties: event.properties || {},
        category: event.category || 'Journey',
        isHistorical: false,
      }

      return {
        ...current,
        activity: [nextEvent, ...current.activity],
      }
    })
  }

  const startMission = (missionId) => {
    setState((current) => {
      const mission = current.missions[missionId]
      if (!mission || mission.status === 'completed' || mission.completedAt || mission.activatedAt) return current
      if (mission.startedAt) return current
      const now = new Date().toISOString()
      return {
        ...current,
        missions: {
          ...current.missions,
          [missionId]: {
            ...mission,
            status: 'in_progress',
            progress: Math.max(mission.progress || 0, 5),
            startedAt: now,
          },
        },
        activity: [{
          id: `mission-started-${missionId}`,
          dedupeKey: `mission-started-${missionId}`,
          eventName: 'Mission started',
          missionId,
          timestamp: now,
          eventSource: 'current-demo',
          properties: {},
          category: 'Journey',
          isHistorical: false,
        }, ...current.activity],
      }
    })
  }

  const completeMission = (missionId, properties = {}) => {
    setState((current) => {
      const mission = current.missions[missionId]
      if (!mission || mission.status === 'completed' || mission.completedAt || mission.activatedAt) return current
      const now = new Date().toISOString()
      const startEvent = mission.startedAt ? [] : [{
        id: `mission-started-${missionId}`,
        dedupeKey: `mission-started-${missionId}`,
        eventName: 'Mission started',
        missionId,
        timestamp: now,
        eventSource: 'current-demo',
        properties: {},
        category: 'Journey',
        isHistorical: false,
      }]
      return {
        ...current,
        missions: {
          ...current.missions,
          [missionId]: {
            ...mission,
            status: 'completed',
            progress: 100,
            startedAt: mission.startedAt || now,
            setupCompletedAt: now,
            completedAt: now,
          },
        },
        activity: [{
          id: `mission-completed-${missionId}`,
          dedupeKey: `mission-completed-${missionId}`,
          eventName: 'Mission completed',
          missionId,
          timestamp: now,
          eventSource: 'current-demo',
          properties,
          category: 'Completion',
          isHistorical: false,
        }, ...startEvent, ...current.activity],
      }
    })
  }

  const resetDemo = () => {
    setState(() => buildDefaultState())
  }

  const activateMission = (missionId) => {
    setState((current) => {
      const mission = current.missions[missionId]
      if (!mission || mission.activatedAt || mission.status === 'completed') return current
      const config = current.missionConfig[missionId] || {}
      const readiness = evaluateReadiness({
        missionId,
        config,
        settings: current.settings,
      })

      if (!readiness.pass) {
        return current
      }

      const now = new Date().toISOString()
      const nextState = {
        ...current,
        missions: {
          ...current.missions,
          [missionId]: {
            ...current.missions[missionId],
            status: 'completed',
            progress: 100,
            setupCompletedAt: now,
            completedAt: now,
            activatedAt: now,
            startedAt: current.missions[missionId]?.startedAt || now,
          },
        },
        metrics: {
          ...current.metrics,
          lastActivatedMissionId: missionId,
        },
      }

      const activationEvent = {
        id: `activation-${missionId}`,
        dedupeKey: `activation-${missionId}`,
        eventName: 'Demo activation confirmed',
        missionId,
        timestamp: now,
        eventSource: 'current-demo',
        category: 'Activation',
        properties: { workflowType: 'demo', status: 'activated' },
      }

      const completionEvent = {
        id: `mission-completed-${missionId}`,
        dedupeKey: `mission-completed-${missionId}`,
        eventName: 'Mission completed',
        missionId,
        timestamp: now,
        eventSource: 'current-demo',
        category: 'Completion',
        properties: { workflowType: 'demo' },
        isHistorical: false,
      }
      const startEvent = current.missions[missionId].startedAt ? [] : [{
        id: `mission-started-${missionId}`,
        dedupeKey: `mission-started-${missionId}`,
        eventName: 'Mission started',
        missionId,
        timestamp: now,
        eventSource: 'current-demo',
        properties: {},
        category: 'Journey',
        isHistorical: false,
      }]
      nextState.activity = [activationEvent, completionEvent, ...startEvent, ...nextState.activity]
      return nextState
    })
  }

  const value = useMemo(() => ({
    state,
    setState,
    updateState,
    updateBusiness,
    updateSettings,
    updateMissionConfig,
    updateMissionState,
    addEvent,
    startMission,
    completeMission,
    resetDemo,
    activateMission,
  }), [state])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useAppState() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useAppState must be used inside AppStateProvider')
  }
  return context
}
