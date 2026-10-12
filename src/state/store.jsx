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
    }))
  }

  const updateSettings = (patch) => {
    setState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        ...patch,
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
      const nextEvent = {
        id: event.id || `event-${Date.now()}-${Math.random().toString(16).slice(2)}`,
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

  const resetDemo = () => {
    setState(() => buildDefaultState())
  }

  const activateMission = (missionId) => {
    setState((current) => {
      const config = current.missionConfig[missionId] || {}
      const readiness = evaluateReadiness({
        missionId,
        config,
        settings: current.settings,
      })

      if (!readiness.pass) {
        return current
      }

      if (current.missions[missionId]?.activatedAt) {
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
            activatedAt: now,
            completedAt: now,
            startedAt: current.missions[missionId]?.startedAt || now,
          },
        },
        metrics: {
          ...current.metrics,
          lastActivatedMissionId: missionId,
        },
      }

      const activationEvent = {
        id: `activation-${missionId}-${now}`,
        eventName: 'Demo activation confirmed',
        missionId,
        timestamp: now,
        eventSource: 'current-demo',
        category: 'Activation',
        properties: { workflowType: 'demo', status: 'activated' },
      }

      nextState.activity = [activationEvent, ...nextState.activity]
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
