import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App.jsx'
import { buildDefaultState, loadPersistedState, persistState, STORAGE_KEY } from '../services/storageService.js'
import { evaluateReadiness } from '../features/missions/missionValidation.js'
import { getRecommendedMission } from '../features/recommendations/recommendationEngine.js'

beforeEach(() => {
  window.localStorage.clear()
  window.history.pushState({}, '', '/')
})

describe('recommendation engine', () => {
  it('returns the expected mission for the selected goal', () => {
    const state = buildDefaultState()
    state.business.goal = 'sales_recovery'
    expect(getRecommendedMission(state).id).toBe('abandoned-cart')
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
})

describe('UI smoke tests', () => {
  it('renders the home page and main recommendation', () => {
    render(<App />)
    expect(screen.getByText(/One growth win at a time/i)).toBeInTheDocument()
    expect(screen.getByText(/Recover more abandoned carts/i)).toBeInTheDocument()
  })

  it('shows the not-found state for an invalid route', () => {
    window.history.pushState({}, '', '/unknown')
    render(<App />)
    expect(screen.getByText(/Mission not found/i)).toBeInTheDocument()
  })
})
