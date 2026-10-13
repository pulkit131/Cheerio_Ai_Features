import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App.jsx'
import { buildDefaultState, loadPersistedState, persistState, STORAGE_KEY } from '../services/storageService.js'
import { evaluateReadiness } from '../features/missions/missionValidation.js'
import { getRecommendedMission } from '../features/recommendations/recommendationEngine.js'
import { calculateFunnel, getCampaignMetrics, getCampaignObservation } from '../features/analytics/analyticsService.js'
import { AppStateProvider, useAppState } from '../state/store.jsx'
import { simulatedCampaigns } from '../data/demoData.js'

beforeEach(() => {
  window.localStorage.clear()
  window.history.pushState({}, '', '/')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('recommendation engine', () => {
  it('returns the expected mission for the selected goal', () => {
    const state = buildDefaultState()
    state.business.goal = 'sales_recovery'
    expect(getRecommendedMission(state).id).toBe('abandoned-cart')
  })

  it('selects a recommendation that matches the goal and excludes completed missions', () => {
    const state = buildDefaultState()
    state.business.goal = 'campaign_performance'
    expect(getRecommendedMission(state).id).toBe('campaign-performance')
    state.missions['campaign-performance'] = {
      ...state.missions['campaign-performance'],
      status: 'completed',
      completedAt: new Date().toISOString(),
    }
    expect(getRecommendedMission(state).id).toBe('abandoned-cart')
  })

  it('does not recommend a completed mission and returns no recommendation when all are complete', () => {
    const state = buildDefaultState()
    for (const mission of Object.values(state.missions)) {
      mission.status = 'completed'
      mission.completedAt = new Date().toISOString()
    }
    expect(getRecommendedMission(state)).toBeNull()
  })

  it('does not resurface a workflow that already has an activation timestamp', () => {
    const state = buildDefaultState()
    state.business.goal = 'campaign_performance'
    state.missions['campaign-performance'].status = 'in_progress'
    state.missions['campaign-performance'].activatedAt = new Date().toISOString()
    expect(getRecommendedMission(state).id).not.toBe('campaign-performance')
  })

  it('updates prerequisite status when a relevant integration setting changes', () => {
    const state = buildDefaultState()
    state.business.goal = 'campaign_performance'
    state.settings.integrations.analytics.connected = false
    const recommendation = getRecommendedMission(state)
    expect(recommendation.id).toBe('campaign-performance')
    expect(recommendation.readiness).toBe('needs_attention')
    expect(recommendation.rationale).toMatch(/campaign analytics connection/i)
  })
})

describe('mission validation', () => {
  it('blocks readiness when the WhatsApp integration is disconnected', () => {
    const result = evaluateReadiness({
      missionId: 'abandoned-cart',
      config: {
        trigger: 'cart_abandonment',
        audience: 'all_eligible',
        timing: '2_hours',
        message: 'Hi {{first_name}}, you left something in your cart: {{cart_link}}',
        reviewConfirmed: true,
      },
      settings: {
        audienceSize: 500,
        templateApproval: 'approved',
        integrations: { whatsapp: { connected: false } },
      },
    })

    expect(result.checks.find((check) => check.id === 'integration').status).toBe('blocked')
  })

  it('blocks readiness when the audience is empty', () => {
    const result = evaluateReadiness({
      missionId: 'abandoned-cart',
      config: {
        trigger: 'cart_abandonment',
        audience: 'all_eligible',
        timing: '2_hours',
        message: 'Hi {{first_name}}, you left something in your cart: {{cart_link}}',
        reviewConfirmed: true,
      },
      settings: {
        audienceSize: 0,
        templateApproval: 'approved',
        integrations: { whatsapp: { connected: true } },
      },
    })

    expect(result.checks.find((check) => check.id === 'audience').status).toBe('blocked')
    expect(result.pass).toBe(false)
  })

  it('blocks readiness for pending approval and invalid audience values', () => {
    const result = evaluateReadiness({
      missionId: 'abandoned-cart',
      config: {
        trigger: 'cart_abandonment',
        audience: 'all_eligible',
        timing: '2_hours',
        message: 'Hi {{first_name}}, you left something in your cart: {{cart_link}}',
        reviewConfirmed: true,
      },
      settings: {
        audienceSize: 1.5,
        templateApproval: 'pending',
        integrations: { whatsapp: { connected: true } },
      },
    })
    expect(result.checks.find((check) => check.id === 'audience').status).toBe('blocked')
    expect(result.checks.find((check) => check.id === 'templateApproval').status).toBe('blocked')
    expect(result.pass).toBe(false)
  })

  it('blocks readiness when the message content is invalid', () => {
    const result = evaluateReadiness({
      missionId: 'abandoned-cart',
      config: {
        trigger: 'cart_abandonment',
        audience: 'all_eligible',
        timing: '2_hours',
        message: 'Hi there, your cart is waiting.',
        reviewConfirmed: true,
      },
      settings: {
        audienceSize: 200,
        templateApproval: 'approved',
        integrations: { whatsapp: { connected: true } },
      },
    })

    expect(result.checks.find((check) => check.id === 'message').status).toBe('blocked')
  })

  it('allows a valid configuration to pass readiness', () => {
    const result = evaluateReadiness({
      missionId: 'abandoned-cart',
      config: {
        trigger: 'cart_abandonment',
        audience: 'all_eligible',
        timing: '2_hours',
        message: 'Hi {{first_name}}, you left something in your cart: {{cart_link}}',
        reviewConfirmed: true,
      },
      settings: {
        audienceSize: 250,
        templateApproval: 'approved',
        integrations: { whatsapp: { connected: true } },
      },
    })

    expect(result.pass).toBe(true)
  })
})

describe('local storage persistence', () => {
  it('saves and reloads draft progress', () => {
    const state = buildDefaultState()
    state.missionConfig['abandoned-cart'].message = 'Hi {{first_name}}, this is saved: {{cart_link}}'
    persistState(state)

    const loaded = loadPersistedState()
    expect(loaded.missionConfig['abandoned-cart'].message).toContain('{{first_name}}')
    expect(loaded.missionConfig['abandoned-cart'].message).toContain('{{cart_link}}')
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy()
  })

  it('recovers from malformed JSON and ignores unknown mission IDs', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorage.setItem(STORAGE_KEY, '{invalid')
    const recovered = loadPersistedState()
    expect(recovered.business.name).toBe('GlowCart')
    expect(recovered.missions['unknown-mission']).toBeUndefined()
  })

  it('normalizes unknown campaign IDs and removes persisted duplicate events', () => {
    const state = buildDefaultState()
    state.missionConfig['campaign-performance'].campaignId = 'unknown-campaign'
    state.activity.push({
      id: 'repeated-event',
      dedupeKey: 'same-start',
      eventName: 'Mission started',
      timestamp: new Date().toISOString(),
      missionId: 'campaign-performance',
      category: 'Journey',
    }, {
      id: 'repeated-event-copy',
      dedupeKey: 'same-start',
      eventName: 'Mission started',
      timestamp: new Date().toISOString(),
      missionId: 'campaign-performance',
      category: 'Journey',
    })
    persistState(state)

    const loaded = loadPersistedState()
    expect(loaded.missionConfig['campaign-performance'].campaignId).toBe('spring-glow')
    expect(loaded.activity.filter((event) => event.dedupeKey === 'same-start')).toHaveLength(1)
  })
})

describe('analytics calculations', () => {
  it('calculates conversion and drop-off and identifies the largest historical bottleneck', () => {
    const funnel = calculateFunnel({
      historical: [
        { id: 'impression', name: 'Viewed', value: 100 },
        { id: 'started', name: 'Started', value: 80 },
        { id: 'setup', name: 'Setup', value: 20 },
      ],
    })
    expect(funnel.rows[1].conversion).toBe(80)
    expect(funnel.rows[1].dropOff).toBeCloseTo(20)
    expect(funnel.bottleneck.id).toBe('setup')
  })

  it('handles a zero denominator and separates seeded history from current events', () => {
    const funnel = calculateFunnel({
      activity: [
        { eventName: 'Mission started', eventSource: 'current-demo' },
        { eventName: 'Mission started', eventSource: 'simulated-history', isHistorical: true },
      ],
      historical: [
        { id: 'impression', name: 'Viewed', value: 0 },
        { id: 'started', name: 'Started', value: 0 },
      ],
    })
    expect(funnel.rows[1].conversion).toBeNull()
    expect(funnel.rows[1].dropOff).toBeNull()
    expect(funnel.rows[1].currentCount).toBe(1)
    expect(funnel.bottleneck).toBeNull()
  })

  it('uses delivered count to calculate campaign conversion and data-backed observations', () => {
    expect(getCampaignMetrics(simulatedCampaigns[0]).conversionRate).toBeCloseTo(89 / 4940 * 100)
    expect(getCampaignObservation(simulatedCampaigns, 'spring-glow').options.length).toBe(3)
  })
})

function StateActions() {
  const {
    state,
    startMission,
    completeMission,
    updateMissionConfig,
    activateMission,
    resetDemo,
  } = useAppState()
  return (
    <div>
      <button onClick={() => startMission('campaign-performance')}>Start twice</button>
      <button onClick={() => completeMission('campaign-performance', { nextAction: 'Test a better offer' })}>Complete twice</button>
      <button onClick={() => updateMissionConfig('abandoned-cart', {
        trigger: 'cart_abandonment',
        audience: 'all_eligible',
        timing: '2_hours',
        message: 'Hi {{first_name}}, your cart: {{cart_link}}',
        reviewConfirmed: true,
      })}>Prepare valid recovery</button>
      <button onClick={() => {
        activateMission('abandoned-cart')
        activateMission('abandoned-cart')
      }}>Activate twice</button>
      <button onClick={resetDemo}>Reset</button>
      <output>{JSON.stringify(state)}</output>
    </div>
  )
}

describe('mission state lifecycle', () => {
  it('prevents duplicate start and completion activity, then resets to defaults', async () => {
    const user = userEvent.setup()
    render(<AppStateProvider><StateActions /></AppStateProvider>)

    await user.click(screen.getByRole('button', { name: 'Start twice' }))
    await user.click(screen.getByRole('button', { name: 'Start twice' }))
    await user.click(screen.getByRole('button', { name: 'Complete twice' }))
    await user.click(screen.getByRole('button', { name: 'Complete twice' }))
    await waitFor(() => {
      const state = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(state.missions['campaign-performance'].status).toBe('completed')
      expect(state.activity.filter((event) => event.eventName === 'Mission started' && event.missionId === 'campaign-performance' && !event.isHistorical)).toHaveLength(1)
      expect(state.activity.filter((event) => event.eventName === 'Mission completed' && event.missionId === 'campaign-performance')).toHaveLength(1)
    })

    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() => {
      const state = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(state.missions['campaign-performance'].status).toBe('not_started')
      expect(state.missions['campaign-performance'].completedAt).toBeNull()
    })
  })

  it('activates a valid demo workflow once and records completion once', async () => {
    const user = userEvent.setup()
    render(<AppStateProvider><StateActions /></AppStateProvider>)
    await user.click(screen.getByRole('button', { name: 'Prepare valid recovery' }))
    await user.click(screen.getByRole('button', { name: 'Activate twice' }))

    await waitFor(() => {
      const state = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(state.missions['abandoned-cart'].activatedAt).toBeTruthy()
      expect(state.activity.filter((event) => event.eventName === 'Demo activation confirmed')).toHaveLength(1)
      expect(state.activity.filter((event) => event.eventName === 'Mission completed' && event.missionId === 'abandoned-cart')).toHaveLength(1)
    })
  })
})

describe('UI smoke tests', () => {
  it('renders the home page and main recommendation', () => {
    render(<App />)
    expect(screen.getAllByText(/Recover more abandoned carts/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { level: 1, name: /Recover more abandoned carts/i })).toBeInTheDocument()
  })

  it('keeps the hero and mission catalogue aligned to the selected business goal', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Selected business goal' }), 'campaign_performance')
    expect(screen.getByRole('heading', { level: 1, name: 'Understand campaign performance' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'All Missions' }))
    const campaignCard = screen.getByRole('heading', { name: 'Understand campaign performance' }).closest('.mission-card')
    expect(campaignCard).toHaveTextContent('Recommended next')
  })

  it('completes the guided campaign-performance mission using simulated sample data', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    window.history.pushState({}, '', '/missions/campaign-performance')
    render(<App />)

    expect(screen.getByText(/simulated sample data/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Review selected campaign/i }))
    expect(screen.getByRole('table', { name: /Simulated campaign comparison/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Choose an observation/i }))
    await user.click(screen.getAllByRole('radio')[0])
    await user.click(screen.getByRole('button', { name: /Document next action/i }))
    await user.type(screen.getByRole('textbox', { name: /What will GlowCart try next/i }), 'Test the strongest campaign with a smaller audience.')
    await user.click(screen.getByRole('button', { name: /Complete mission/i }))

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(saved.missions['campaign-performance'].status).toBe('completed')
      expect(saved.missions['campaign-performance'].setupCompletedAt).toBeTruthy()
      expect(saved.missions['campaign-performance'].activatedAt).toBeNull()
      expect(saved.activity.filter((event) => event.eventName === 'Mission completed' && event.missionId === 'campaign-performance')).toHaveLength(1)
    })
  })

  it('filters activity by mission and shows readable event context', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', '/activity')
    render(<App />)
    expect(screen.getByText('Recommendation dismissed')).toBeInTheDocument()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by mission' }), 'campaign-performance')
    expect(screen.queryByText('Recommendation dismissed')).not.toBeInTheDocument()
    expect(screen.getByText('Simulated history')).toBeInTheDocument()
    expect(screen.getByText(/user began this mission in the demo workspace/i)).toBeInTheDocument()
  })

  it('toggles and persists the color theme', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).settings.theme).toBe('dark')

    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })

  it('shows the not-found state for an invalid route', () => {
    window.history.pushState({}, '', '/unknown')
    render(<App />)
    expect(screen.getByText(/Mission not found/i)).toBeInTheDocument()
  })
})
