import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  BarChart3,
  BellRing,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  Compass,
  Gauge,
  Home,
  ListTodo,
  MessageSquareText,
  Moon,
  RefreshCcw,
  Search,
  Settings,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Users,
  Workflow,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Funnel,
  FunnelChart,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { defaultBusiness, historicalInsights, missionCatalog, funnelStages } from './data/demoData.js'
import { getRecommendedMission } from './features/recommendations/recommendationEngine.js'
import { evaluateReadiness } from './features/missions/missionValidation.js'
import { AppStateProvider, useAppState } from './state/store.jsx'

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/missions', label: 'All Missions', icon: Compass },
  { to: '/progress', label: 'My Progress', icon: Gauge },
  { to: '/insights', label: 'Insights', icon: BarChart3 },
  { to: '/activity', label: 'Activity Log', icon: Activity },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const businessGoalChoices = {
  sales_recovery: 'Recover lost sales',
  repeat_purchases: 'Grow repeat purchases',
  campaign_performance: 'Improve campaign performance',
}

const timingOptions = {
  '30_minutes': '30 minutes',
  '2_hours': '2 hours',
  '24_hours': '24 hours',
}

const placeholderButtons = [
  { label: 'First name', value: '{{first_name}}' },
  { label: 'Cart link', value: '{{cart_link}}' },
]

function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AppStateProvider>
  )
}

function AppLayout() {
  const { state, updateBusiness, updateSettings } = useAppState()
  const theme = state.settings.theme === 'dark' ? 'dark' : 'light'

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  }, [theme])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-wrap">
          <div className="brand-mark">C</div>
          <div>
            <div className="brand-title">Cheerio</div>
            <div className="brand-subtitle">Growth Missions</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-card">
          <div className="profile-row">
            <div className="profile-avatar">G</div>
            <div>
              <div className="profile-name">GlowCart</div>
              <div className="profile-meta">Demo account</div>
            </div>
          </div>
          <select
            className="select-control"
            value={state.business.goal}
            onChange={(event) => updateBusiness({ goal: event.target.value })}
            aria-label="Selected business goal"
          >
            {Object.entries(businessGoalChoices).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </aside>

      <div className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <div className="crumbs">Demo workspace / GlowCart</div>
            <div className="status-pill">
              <Sparkles size={12} />
              Demo mode
            </div>
          </div>
          <div className="topbar-right">
            <button
              type="button"
              className="ghost-button theme-toggle"
              onClick={() => updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' })}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>
            <button type="button" className="ghost-button" aria-label="Open help">
              <BellRing size={16} />
              Help
            </button>
          </div>
        </header>

        <main className="content-wrap">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/missions" element={<MissionsPage />} />
            <Route path="/missions/:missionId" element={<MissionDetailPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function HomePage() {
  const { state } = useAppState()
  const recommendation = getRecommendedMission(state)
  const missionMap = state.missions
  const completedCount = Object.values(missionMap).filter((mission) => mission.status === 'completed').length
  const inProgressCount = Object.values(missionMap).filter((mission) => mission.status === 'in_progress').length

  const otherMissions = missionCatalog.filter((mission) => mission.id !== recommendation.id).slice(0, 2)
  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Recommended next action</p>
          <h1>One growth win at a time.</h1>
          <p className="lede">Turn your WhatsApp campaigns into a high-converting recovery workflow for GlowCart.</p>
        </div>
        <div className="hero-actions">
          <Link to={`/missions/${recommendation.id}`} className="primary-button">
            Start mission
            <ArrowRight size={16} />
          </Link>
          <Link to="/missions" className="secondary-button">Explore other missions</Link>
        </div>
      </section>

      <section className="recommendation-card">
        <div className="recommendation-header">
          <div>
            <p className="eyebrow accent">Recommended mission</p>
            <h2>{recommendation.title}</h2>
          </div>
          <span className="priority-badge">Priority {recommendation.priority}</span>
        </div>

        <p className="mission-copy">{recommendation.rationale}</p>

        <div className="mini-metrics-row">
          <MetricCard label="Setup time" value={recommendation.effort} icon={ClockIcon} />
          <MetricCard label="Current readiness" value="Ready to start" icon={Target} />
          <MetricCard label="Prerequisites" value="2 must-haves" icon={CheckCircle2} />
        </div>

        <div className="recommendation-footer">
          <details>
            <summary>Why this recommendation?</summary>
            <div className="details-body">
              <ul>
                {recommendation.reasonCodes.map((reason) => (
                  <li key={reason}>{reason.replace(/_/g, ' ')}</li>
                ))}
              </ul>
            </div>
          </details>
          <Link to={`/missions/${recommendation.id}`} className="primary-button compact">
            Start mission
          </Link>
        </div>
      </section>

      <section className="two-column-grid">
        <div className="card-block">
          <div className="section-headline">
            <h3>Other opportunities</h3>
          </div>
          {otherMissions.map((mission) => (
            <Link key={mission.id} to={`/missions/${mission.id}`} className="mission-mini-card">
              <div>
                <p className="mini-tag">{mission.category}</p>
                <h4>{mission.title}</h4>
              </div>
              <ChevronRight size={18} />
            </Link>
          ))}
        </div>

        <div className="card-block">
          <div className="section-headline">
            <h3>Progress summary</h3>
          </div>
          <div className="progress-summary-grid">
            <SummaryStat label="Completed" value={String(completedCount)} />
            <SummaryStat label="In progress" value={String(inProgressCount)} />
            <SummaryStat label="Best streak" value="Onboarding" />
            <SummaryStat label="Next step" value={recommendation.nextAction} />
          </div>
        </div>
      </section>
    </div>
  )
}

function MissionsPage() {
  const { state } = useAppState()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  const categories = ['All', ...new Set(missionCatalog.map((mission) => mission.category))]
  const filteredMissions = missionCatalog.filter((mission) => {
    const matchesCategory = category === 'All' || mission.category === category
    const matchesSearch = `${mission.title} ${mission.description}`.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="page-stack">
      <section className="page-header-row">
        <div>
          <p className="eyebrow">Mission discovery</p>
          <h1>Growth opportunities</h1>
        </div>
      </section>

      <div className="toolbar-row">
        <div className="search-box">
          <Search size={16} />
          <input
            type="search"
            placeholder="Search missions"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search missions"
          />
        </div>

        <div className="filter-group" role="tablist" aria-label="Mission categories">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`filter-pill ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="mission-grid">
        {filteredMissions.map((mission) => {
          const missionState = state.missions[mission.id] || { status: 'not_started', progress: 0 }
          const isRecommended = mission.id === getRecommendedMission(state).id
          return (
            <div key={mission.id} className="mission-card">
              <div className="mission-card-top">
                <span className="status-pill subtle">{isRecommended ? 'Recommended' : missionState.status}</span>
                <span className="mission-tag">{mission.category}</span>
              </div>
              <h3>{mission.title}</h3>
              <p>{mission.description}</p>
              <ul className="meta-list">
                <li>Outcome: {mission.outcome}</li>
                <li>Effort: {mission.effort}</li>
                <li>Prereqs: {mission.prerequisites[0]}</li>
              </ul>
              <div className="card-footer-row">
                <div className="progress-mini">
                  <div className="bar" style={{ width: `${missionState.progress}%` }} />
                </div>
                <Link to={`/missions/${mission.id}`} className="primary-button compact">
                  {mission.id === 'abandoned-cart' ? 'Open mission' : 'Review'}
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MissionDetailPage() {
  const { missionId } = useParams()
  const { state, updateMissionConfig, updateMissionState, addEvent, activateMission } = useAppState()
  const navigate = useNavigate()
  const mission = missionCatalog.find((item) => item.id === missionId)

  if (!mission) return <NotFoundPage />

  const fallbackConfig = state.missionConfig[missionId] || {
    trigger: 'cart_abandonment',
    audience: 'all_eligible',
    timing: '2_hours',
    message: 'Hi {{first_name}}, you left something in your cart. Take another look when you\'re ready: {{cart_link}}',
    reviewConfirmed: false,
    currentStep: 0,
  }

  const config = fallbackConfig
  const readiness = evaluateReadiness({ missionId, config, settings: state.settings })
  const missionState = state.missions[missionId] || { status: 'not_started', progress: 0 }

  const updateCurrentStep = (nextStep) => {
    updateMissionConfig(missionId, { currentStep: nextStep })
  }

  const startMission = () => {
    const now = new Date().toISOString()
    updateMissionState(missionId, {
      status: 'in_progress',
      startedAt: missionState.startedAt || now,
      progress: Math.max(missionState.progress, 25),
    })

    addEvent({
      eventName: 'Mission started',
      missionId,
      timestamp: now,
      eventSource: 'current-demo',
      properties: { missionId, step: 'overview' },
      category: 'Journey',
    })
  }

  const handleSaveDraft = (patch = {}) => {
    updateMissionConfig(missionId, patch)
  }

  const stepIndex = Number(config.currentStep || 0)
  const stepTitles = ['Trigger', 'Audience', 'Timing', 'Message', 'Review', 'Readiness', 'Activation']
  const stepLabel = stepTitles[Math.min(stepIndex, stepTitles.length - 1)]
  const isPrimaryMission = missionId === 'abandoned-cart'

  if (!isPrimaryMission) {
    return (
      <div className="page-stack">
        <div className="mission-detail-page">
          <section className="detail-head-section">
            <div>
              <p className="eyebrow">Mission detail</p>
              <h1>{mission.title}</h1>
            </div>
            <div className="detail-meta-group">
              <span className="status-pill subtle">{missionState.status}</span>
              <span className="mission-tag">{mission.category}</span>
            </div>
          </section>

          <section className="detail-summary">
            <div>
              <h3>Business outcome</h3>
              <p>{mission.outcome}</p>
            </div>
            <div>
              <h3>Why it matters</h3>
              <p>{mission.recommendedReason}</p>
            </div>
            <div>
              <h3>Suggested setup</h3>
              <p>{mission.setupSteps.join(' → ')}</p>
            </div>
          </section>

          <div className="builder-card">
            <h3>Quick workflow</h3>
            <div className="summary-list">
              {mission.setupSteps.map((step, idx) => (
                <div key={step} className="summary-line">
                  <span>Step {idx + 1}</span>
                  <strong>{step}</strong>
                </div>
              ))}
            </div>
            <div className="buttons-row" style={{ marginTop: '18px' }}>
              <button
                type="button"
                className="primary-button compact"
                onClick={() => {
                  const now = new Date().toISOString()
                  updateMissionState(missionId, {
                    status: 'in_progress',
                    startedAt: missionState.startedAt || now,
                    progress: 45,
                  })
                  addEvent({
                    eventName: 'Mission started',
                    missionId,
                    timestamp: now,
                    eventSource: 'current-demo',
                    properties: { flow: 'secondary-mission' },
                    category: 'Journey',
                  })
                  navigate('/missions')
                }}
              >
                Start setup
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderStepContent = () => {
    if (stepIndex === 0) {
      return (
        <div className="builder-step">
          <h3>When should this journey begin?</h3>
          <div className="option-grid">
            {[
              { value: 'cart_abandonment', label: 'When a customer abandons a cart', description: 'Ideal for shoppers who leave without completing checkout.' },
              { value: 'inactive_customer', label: 'When a customer becomes inactive', description: 'Helpful for lapsed buyers who have not returned.' },
              { value: 'purchase', label: 'When a customer makes a purchase', description: 'Useful for a post-purchase cross-sell or thank-you flow.' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={`choice-card ${config.trigger === option.value ? 'selected' : ''}`}
                onClick={() => handleSaveDraft({ trigger: option.value })}
              >
                <div className="choice-title">{option.label}</div>
                <div className="choice-description">{option.description}</div>
              </button>
            ))}
          </div>
          <div className="notice-box">Selected trigger: {config.trigger === 'cart_abandonment' ? 'Abandoned cart recovery' : 'Alternate scenario'}</div>
        </div>
      )
    }

    if (stepIndex === 1) {
      return (
        <div className="builder-step">
          <h3>Who should receive this follow-up?</h3>
          <div className="option-grid compact-grid">
            {[
              { value: 'all_eligible', label: 'All eligible customers', description: 'Broadest coverage for a first pass.' },
              { value: 'abandoned_only', label: 'Customers who have abandoned a cart', description: 'High intent and most relevant.' },
              { value: 'selected_segment', label: 'Customers in a selected segment', description: 'A curated, tailored audience.' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={`choice-card ${config.audience === option.value ? 'selected' : ''}`}
                onClick={() => handleSaveDraft({ audience: option.value })}
              >
                <div className="choice-title">{option.label}</div>
                <div className="choice-description">{option.description}</div>
              </button>
            ))}
          </div>
          <div className="notice-box">
            Demo eligible audience: {state.settings.audienceSize || 0} shoppers
            {Number(state.settings.audienceSize || 0) === 0 ? ' — no audience available' : ''}
          </div>
        </div>
      )
    }

    if (stepIndex === 2) {
      return (
        <div className="builder-step">
          <h3>When should the follow-up be sent?</h3>
          <div className="option-grid compact-grid">
            {Object.entries(timingOptions).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`choice-card ${config.timing === value ? 'selected' : ''}`}
                onClick={() => handleSaveDraft({ timing: value })}
              >
                <div className="choice-title">{label}</div>
                <div className="choice-description">{label === '30 minutes' ? 'Fast follow-up to recover intent while it is fresh.' : label === '2 hours' ? 'A balanced recovery window for warm leads.' : 'Good for customers who may need a second reminder.'}</div>
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (stepIndex === 3) {
      return (
        <div className="builder-step">
          <h3>Create the message</h3>
          <label className="field-label" htmlFor="message-editor">Demo message content</label>
          <textarea
            id="message-editor"
            value={config.message}
            onChange={(event) => handleSaveDraft({ message: event.target.value })}
            className="message-textarea"
          />
          <div className="message-actions-row">
            <div className="charcount">{(config.message || '').length} characters</div>
            <div className="placeholder-buttons">
              {placeholderButtons.map((placeholder) => (
                <button
                  key={placeholder.value}
                  type="button"
                  className="ghost-button tiny"
                  onClick={() => handleSaveDraft({ message: `${config.message || ''}${config.message?.endsWith(' ') ? '' : ' '}${placeholder.value}` })}
                >
                  {placeholder.label}
                </button>
              ))}
            </div>
          </div>
          <div className="notice-box">Simulated approval status: {state.settings.templateApproval === 'approved' ? 'Approved' : 'Awaiting approval'}</div>
        </div>
      )
    }

    if (stepIndex === 4) {
      return (
        <div className="builder-step">
          <h3>Review configuration</h3>
          <div className="summary-list">
            <SummaryLine label="Trigger" value={config.trigger || 'Not set'} />
            <SummaryLine label="Audience" value={config.audience || 'Not set'} />
            <SummaryLine label="Timing" value={timingOptions[config.timing] || 'Not set'} />
            <SummaryLine label="Message" value={config.message || 'No message provided'} />
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={Boolean(config.reviewConfirmed)}
              onChange={(event) => handleSaveDraft({ reviewConfirmed: event.target.checked })}
            />
            <span>I have reviewed this configuration.</span>
          </label>

          <div className="buttons-row">
            <button type="button" className="primary-button compact" onClick={() => updateCurrentStep(5)}>
              Check readiness
            </button>
          </div>
        </div>
      )
    }

    if (stepIndex === 5) {
      return (
        <div className="builder-step">
          <h3>Readiness checks</h3>
          {readiness.checks.map((check) => (
            <div key={check.id} className={`check-row ${check.status}`}>
              <div className="check-header">
                <strong>{check.label}</strong>
                <span className={`status-tag ${check.status}`}>{check.status}</span>
              </div>
              <p>{check.explanation}</p>
              {check.fix && <small>{check.fix}</small>}
            </div>
          ))}

          {readiness.pass ? (
            <div className="success-box">Ready to activate the demo workflow. The next step is to confirm activation.</div>
          ) : (
            <div className="warning-box">A blocking check remains. Fix the highlighted issues to continue.</div>
          )}
        </div>
      )
    }

    return (
      <div className="builder-step">
        <h3>Simulated activation</h3>
        <p>No real WhatsApp messages will be sent. This is a demo-only workflow activation.</p>
        <div className="notice-box">
          Outcome: Demo workflow activated
        </div>
        <div className="buttons-row">
          <button
            type="button"
            className="primary-button compact"
            onClick={() => {
              const confirmed = window.confirm('Confirm demo activation? No real messages will be sent.')
              if (!confirmed) return
              if (!missionState.activatedAt) {
                startMission()
              }
              activateMission(missionId)
              addEvent({
                eventName: 'Mission completed',
                missionId,
                timestamp: new Date().toISOString(),
                eventSource: 'current-demo',
                properties: { workflow: 'demo' },
                category: 'Completion',
              })
              navigate('/progress')
            }}
          >
            Activate demo workflow
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <div className="mission-detail-page">
        <section className="detail-head-section">
          <div>
            <p className="eyebrow">Mission detail</p>
            <h1>{mission.title}</h1>
          </div>
          <div className="detail-meta-group">
            <span className="status-pill subtle">{missionState.status}</span>
            <span className="mission-tag">{mission.category}</span>
          </div>
        </section>

        <section className="detail-summary">
          <div>
            <h3>Business outcome</h3>
            <p>{mission.outcome}</p>
          </div>
          <div>
            <h3>Why it is recommended</h3>
            <p>{mission.recommendedReason}</p>
          </div>
          <div>
            <h3>Current status</h3>
            <p>{missionState.status === 'completed' ? 'Demo workflow activated.' : 'Draft configuration in progress.'}</p>
          </div>
        </section>

        <div className="workflow-shell">
          <div className="stepper">
            {stepTitles.map((title, index) => (
              <button
                key={title}
                type="button"
                className={`stepper-item ${index === stepIndex ? 'active' : ''} ${index < stepIndex ? 'done' : ''}`}
                onClick={() => updateCurrentStep(index)}
              >
                <span>{index + 1}</span>{title}
              </button>
            ))}
          </div>

          <div className="builder-card">
            <div className="builder-card-header">
              <h2>{stepLabel}</h2>
            </div>
            {renderStepContent()}
            <div className="buttons-row">
              <button type="button" className="secondary-button" onClick={() => updateCurrentStep(Math.max(0, stepIndex - 1))} disabled={stepIndex === 0}>
                Previous
              </button>
              <button
                type="button"
                className="primary-button compact"
                onClick={() => {
                  if (stepIndex === 6) return
                  updateCurrentStep(Math.min(stepTitles.length - 1, stepIndex + 1))
                }}
              >
                {stepIndex === 5 ? 'Review activation' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProgressPage() {
  const { state } = useAppState()
  const missionCount = Object.keys(state.missions).length
  const completedCount = Object.values(state.missions).filter((mission) => mission.status === 'completed').length
  const activatedCount = Object.values(state.missions).filter((mission) => mission.activatedAt).length
  const completionRate = missionCount ? Math.round((completedCount / missionCount) * 100) : 0

  return (
    <div className="page-stack">
      <section className="page-header-row">
        <div>
          <p className="eyebrow">My progress</p>
          <h1>Adoption dashboard</h1>
        </div>
      </section>

      <div className="metric-grid">
        <MetricCard label="Missions started" value={String(missionCount)} icon={ListTodo} />
        <MetricCard label="Completed" value={String(completedCount)} icon={CheckCircle2} />
        <MetricCard label="Activated in demo mode" value={String(activatedCount)} icon={Workflow} />
        <MetricCard label="Completion rate" value={`${completionRate}%`} icon={TrendingUp} />
      </div>

      <div className="two-column-grid">
        <div className="card-block">
          <h3>Mission timeline</h3>
          <div className="timeline-list">
            {state.activity.slice(0, 6).map((event) => (
              <div key={event.id} className="timeline-item">
                <div className="timeline-dot" />
                <div>
                  <div className="timeline-title">{event.eventName}</div>
                  <div className="timeline-subtitle">{event.missionId || 'General'} · {new Date(event.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card-block">
          <h3>Next recommendation</h3>
          <div className="recommendation-panel">
            <div className="mini-tag">{state.business.goal}</div>
            <h4>{getRecommendedMission(state).title}</h4>
            <p>{getRecommendedMission(state).rationale}</p>
            <Link to={`/missions/${getRecommendedMission(state).id}`} className="primary-button compact">Take next step</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function InsightsPage() {
  const { state } = useAppState()
  const funnelData = funnelStages.map((stage, index) => ({
    name: stage.name,
    value: stage.value,
    fill: index === 0 ? '#5b5bd6' : '#95a3ff',
  }))

  return (
    <div className="page-stack">
      <section className="page-header-row">
        <div>
          <p className="eyebrow">Insights</p>
          <h1>Feature adoption funnel</h1>
        </div>
      </section>

      <div className="insight-columns">
        <div className="card-block chart-card">
          <h3>Funnel</h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="value" data={funnelData} isAnimationActive={false} />
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-block chart-card">
          <h3>Weekly trends</h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={historicalInsights}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="missionStarted" stroke="#5b5bd6" strokeWidth={3} />
                <Line type="monotone" dataKey="activated" stroke="#1ba97d" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card-block">
        <h3>Recommended product improvement</h3>
        <div className="insight-guide">
          <div>
            <strong>Likely bottleneck</strong>
            <p>Readiness validation is the most common drop-off, especially when the WhatsApp integration is disconnected or the template is still pending approval.</p>
          </div>
          <div>
            <strong>Suggested action</strong>
            <p>Move the “Connect WhatsApp” and “Approve template” checks earlier in the flow to reduce drop-off before users reach the final activation step.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivityPage() {
  const { state } = useAppState()
  const [missionFilter, setMissionFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filtered = state.activity.filter((event) => {
    const missionMatch = missionFilter === 'all' || event.missionId === missionFilter
    const categoryMatch = categoryFilter === 'all' || event.category === categoryFilter
    return missionMatch && categoryMatch
  })

  return (
    <div className="page-stack">
      <section className="page-header-row">
        <div>
          <p className="eyebrow">Activity log</p>
          <h1>Audit trail</h1>
        </div>
      </section>

      <div className="toolbar-row compact-gap">
        <select className="select-control" value={missionFilter} onChange={(event) => setMissionFilter(event.target.value)} aria-label="Filter by mission">
          <option value="all">All missions</option>
          {missionCatalog.map((mission) => (<option key={mission.id} value={mission.id}>{mission.title}</option>))}
        </select>
        <select className="select-control" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filter by event type">
          <option value="all">All categories</option>
          {[...new Set(state.activity.map((event) => event.category))].map((category) => (<option key={category} value={category}>{category}</option>))}
        </select>
      </div>

      <div className="activity-list">
        {filtered.map((event) => (
          <div key={event.id} className="activity-item">
            <div className="activity-icon">
              <Workflow size={16} />
            </div>
            <div className="activity-content">
              <div className="activity-head">
                <strong>{event.eventName}</strong>
                <span>{event.isHistorical ? 'Simulated history' : 'Current demo'}</span>
              </div>
              <div className="timeline-subtitle">{event.missionId || 'General'} • {new Date(event.timestamp).toLocaleString()}</div>
              <pre>{JSON.stringify(event.properties, null, 2)}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SettingsPage() {
  const { state, updateBusiness, updateSettings, resetDemo } = useAppState()

  const handleReset = () => {
    const confirmed = window.confirm('Reset the demo application to its original state?')
    if (confirmed) {
      resetDemo()
    }
  }

  return (
    <div className="page-stack">
      <section className="page-header-row">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Demo configuration</h1>
        </div>
      </section>

      <div className="settings-grid">
        <div className="card-block">
          <h3>Business</h3>
          <label className="field-label">Business goal</label>
          <select className="select-control" value={state.business.goal} onChange={(event) => updateBusiness({ goal: event.target.value })}>
            <option value="sales_recovery">Recover lost sales</option>
            <option value="repeat_purchases">Grow repeat purchases</option>
            <option value="campaign_performance">Improve campaign performance</option>
          </select>

          <label className="field-label">Business category</label>
          <input className="text-input" value={state.business.category} onChange={(event) => updateBusiness({ category: event.target.value })} />

          <label className="field-label">Primary communication channel</label>
          <input className="text-input" value={state.business.channel} onChange={(event) => updateBusiness({ channel: event.target.value })} />
        </div>

        <div className="card-block">
          <h3>Recommendation settings</h3>
          <label className="checkbox-row"><input type="checkbox" checked={state.settings.recommendationPreferences.salesRecovery} onChange={(event) => updateSettings({ recommendationPreferences: { ...state.settings.recommendationPreferences, salesRecovery: event.target.checked } })} /><span>Sales recovery</span></label>
          <label className="checkbox-row"><input type="checkbox" checked={state.settings.recommendationPreferences.retention} onChange={(event) => updateSettings({ recommendationPreferences: { ...state.settings.recommendationPreferences, retention: event.target.checked } })} /><span>Retention</span></label>
          <label className="checkbox-row"><input type="checkbox" checked={state.settings.recommendationPreferences.analytics} onChange={(event) => updateSettings({ recommendationPreferences: { ...state.settings.recommendationPreferences, analytics: event.target.checked } })} /><span>Analytics</span></label>
          <label className="checkbox-row"><input type="checkbox" checked={state.settings.recommendationPreferences.segmentation} onChange={(event) => updateSettings({ recommendationPreferences: { ...state.settings.recommendationPreferences, segmentation: event.target.checked } })} /><span>Segmentation</span></label>
        </div>

        <div className="card-block">
          <h3>Demo integrations</h3>
          <label className="checkbox-row"><input type="checkbox" checked={Boolean(state.settings.integrations.whatsapp.connected)} onChange={(event) => updateSettings({ integrations: { ...state.settings.integrations, whatsapp: { ...state.settings.integrations.whatsapp, connected: event.target.checked } } })} /><span>WhatsApp connected</span></label>
          <label className="checkbox-row"><input type="checkbox" checked={Boolean(state.settings.integrations.crm.connected)} onChange={(event) => updateSettings({ integrations: { ...state.settings.integrations, crm: { ...state.settings.integrations.crm, connected: event.target.checked } } })} /><span>CRM connected</span></label>
          <label className="field-label">Template approval</label>
          <select className="select-control" value={state.settings.templateApproval} onChange={(event) => updateSettings({ templateApproval: event.target.value })}>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
          <label className="field-label">Audience size</label>
          <input className="text-input" type="number" value={state.settings.audienceSize} onChange={(event) => updateSettings({ audienceSize: Number(event.target.value) || 0 })} />
        </div>

        <div className="card-block danger-card">
          <h3>Reset demo data</h3>
          <p>Restore the original demo business, defaults, and mission state without clearing unrelated browser storage.</p>
          <button type="button" className="danger-button" onClick={handleReset}>Reset demo data</button>
        </div>
      </div>
    </div>
  )
}

function NotFoundPage() {
  return (
    <div className="empty-page">
      <h1>Mission not found</h1>
      <p>The requested mission does not exist in this demo workspace.</p>
      <Link to="/missions" className="primary-button compact">Back to missions</Link>
    </div>
  )
}

function MetricCard({ label, value, icon: Icon }) {
  return (
    <div className="metric-card">
      <div className="metric-icon">
        <Icon size={16} />
      </div>
      <div>
        <div className="metric-label">{label}</div>
        <div className="metric-value">{value}</div>
      </div>
    </div>
  )
}

function SummaryStat({ label, value }) {
  return (
    <div className="summary-stat">
      <div className="summary-label">{label}</div>
      <div className="summary-value">{value}</div>
    </div>
  )
}

function SummaryLine({ label, value }) {
  return (
    <div className="summary-line">
      <span>{label}</span>
      <strong>{String(value)}</strong>
    </div>
  )
}

function ClockIcon() {
  return <CircleDashed size={16} />
}

export default App
