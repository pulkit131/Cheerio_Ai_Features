import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowRight,
  BarChart3,
  BellRing,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Compass,
  Gauge,
  Home,
  ListTodo,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Workflow,
} from 'lucide-react'
import {
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
import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { defaultSettings, historicalInsights, missionCatalog, simulatedCampaigns } from './data/demoData.js'
import { getRecommendedMission } from './features/recommendations/recommendationEngine.js'
import { evaluateReadiness } from './features/missions/missionValidation.js'
import {
  calculateFunnel,
  getCampaignMetrics,
  getCampaignObservation,
} from './features/analytics/analyticsService.js'
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

const triggerLabels = {
  cart_abandonment: 'Cart is abandoned',
  inactive_customer: 'Customer becomes inactive',
  purchase: 'Customer makes a purchase',
}

const audienceLabels = {
  all_eligible: 'All eligible customers',
  abandoned_only: 'Customers with an abandoned cart',
  selected_segment: 'Customers in a selected segment',
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
  const { state, startMission } = useAppState()
  const recommendation = getRecommendedMission(state)
  const missionMap = state.missions
  const completedCount = Object.values(missionMap).filter((mission) => mission.status === 'completed').length
  const inProgressCount = Object.values(missionMap).filter((mission) => mission.status === 'in_progress').length

  const otherMissions = missionCatalog
    .filter((mission) => mission.id !== recommendation?.id && state.missions[mission.id]?.status !== 'completed')
    .slice(0, 2)
  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Recommended next action</p>
          <h1>{recommendation?.title || 'Your missions are complete'}</h1>
          <p className="lede">{recommendation?.rationale || 'You have completed every available demo mission. Review progress or change your business goal to explore what fits next.'}</p>
        </div>
        <div className="hero-actions">
          {recommendation ? (
            <Link
              to={`/missions/${recommendation.id}`}
              className="primary-button"
              onClick={() => startMission(recommendation.id)}
            >
              {recommendation.nextAction}
              <ArrowRight size={16} />
            </Link>
          ) : <Link to="/progress" className="primary-button">View progress</Link>}
          <Link to="/missions" className="secondary-button">Explore other missions</Link>
        </div>
      </section>

      {recommendation && <section className="recommendation-card">
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
          <MetricCard label="Setup readiness" value={recommendation.readiness === 'ready' ? 'Prerequisites clear' : 'Needs attention'} icon={Target} />
          <MetricCard label="Required checks" value={`${recommendation.prerequisites.length} to verify`} icon={CheckCircle2} />
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
          <Link
            to={`/missions/${recommendation.id}`}
            className="primary-button compact"
            onClick={() => startMission(recommendation.id)}
          >
            {recommendation.nextAction}
          </Link>
        </div>
      </section>}

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
            <SummaryStat label="Demo missions completed" value={`${completedCount} of ${missionCatalog.length}`} />
            <SummaryStat label="Next step" value={recommendation.nextAction} />
          </div>
        </div>
      </section>
    </div>
  )
}

function MissionsPage() {
  const { state, startMission } = useAppState()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  const categories = ['All', ...new Set(missionCatalog.map((mission) => mission.category))]
  const recommendation = getRecommendedMission(state)
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
          const isRecommended = mission.id === recommendation?.id
          return (
            <div key={mission.id} className="mission-card">
              <div className="mission-card-top">
                <span className={`status-pill subtle ${missionState.status === 'completed' ? 'completed' : ''}`}>
                  {isRecommended ? 'Recommended next' : formatMissionStatus(missionState.status)}
                </span>
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
                <Link
                  to={`/missions/${mission.id}`}
                  className="primary-button compact"
                  onClick={() => startMission(mission.id)}
                >
                  {missionState.status === 'completed' ? 'Review outcome' : missionState.status === 'in_progress' ? 'Continue' : 'Start'}
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
  const {
    state,
    updateMissionConfig,
    updateMissionState,
    addEvent,
    startMission,
    completeMission,
    activateMission,
  } = useAppState()
  const navigate = useNavigate()
  const mission = missionCatalog.find((item) => item.id === missionId)

  useEffect(() => {
    if (!mission) return
    addEvent({
      id: `mission-viewed-${mission.id}`,
      dedupeKey: `mission-viewed-${mission.id}`,
      eventName: 'Mission viewed',
      missionId: mission.id,
      eventSource: 'current-demo',
      category: 'Discovery',
      properties: {},
    })
  }, [addEvent, mission])

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
    const currentStep = Number(config.currentStep || 0)
    if (missionId === 'abandoned-cart' && missionState.status !== 'completed') startMission(missionId)
    if (nextStep > currentStep) {
      addEvent({
        eventName: 'Setup step completed',
        missionId,
        dedupeKey: `setup-step-${missionId}-${currentStep}`,
        properties: { step: stepTitles[currentStep] },
        category: 'Journey',
      })
    }
    updateMissionConfig(missionId, { currentStep: nextStep })
    if (missionId === 'abandoned-cart' && missionState.status !== 'completed') {
      updateMissionState(missionId, {
        status: 'in_progress',
        progress: Math.max(missionState.progress || 0, Math.min(90, Math.round((nextStep / 6) * 90))),
      })
    }
  }

  const handleSaveDraft = (patch = {}) => {
    updateMissionConfig(missionId, patch)
  }

  const stepIndex = Number(config.currentStep || 0)
  const stepTitles = ['Trigger', 'Audience', 'Timing', 'Message', 'Review', 'Readiness', 'Activation']
  const stepLabel = stepTitles[Math.min(stepIndex, stepTitles.length - 1)]
  const isPrimaryMission = missionId === 'abandoned-cart'

  if (missionId === 'campaign-performance') {
    return (
      <CampaignPerformanceJourney
        state={state}
        mission={mission}
        missionState={missionState}
        config={config}
        updateMissionConfig={updateMissionConfig}
        updateMissionState={updateMissionState}
        startMission={startMission}
        completeMission={completeMission}
      />
    )
  }

  if (!isPrimaryMission) {
    return (
      <div className="page-stack">
        <RecommendationStrip state={state} />
        <div className="mission-detail-page">
          <section className="detail-head-section">
            <div>
              <p className="eyebrow">Mission detail</p>
              <h1>{mission.title}</h1>
            </div>
            <div className="detail-meta-group">
              <span className="status-pill subtle">{formatMissionStatus(missionState.status)}</span>
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
                  startMission(missionId)
                  updateMissionState(missionId, { progress: 45 })
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
            maxLength={1024}
            onChange={(event) => handleSaveDraft({ message: event.target.value })}
            className="message-textarea"
          />
          <div className="message-actions-row">
            <div className="charcount">{(config.message || '').length}/1,024 characters</div>
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
          <div className="message-preview">
            <span className="mini-tag">Live preview · simulated</span>
            <p>
              {(config.message || '')
                .replaceAll('{{first_name}}', 'Asha')
                .replaceAll('{{cart_link}}', 'glowcart.example/demo-cart')}
            </p>
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
            <SummaryLine label="Trigger" value={triggerLabels[config.trigger] || 'Not set'} />
            <SummaryLine label="Audience" value={audienceLabels[config.audience] || 'Not set'} />
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
            <button
              type="button"
              className="primary-button compact"
              onClick={() => {
                addEvent({
                  eventName: readiness.pass ? 'Readiness passed' : 'Validation failed',
                  missionId,
                  dedupeKey: readiness.pass
                    ? `readiness-passed-${missionId}`
                    : `validation-failed-${missionId}-${Date.now()}`,
                  properties: readiness.pass
                    ? { checksPassed: readiness.passCount }
                    : { blockedChecks: readiness.checks.filter((check) => check.status === 'blocked').map((check) => check.id) },
                  category: 'Validation',
                })
                updateCurrentStep(5)
              }}
            >
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
                <span className={`status-tag ${check.status}`}>
                  {check.status === 'pass' ? 'Passed' : check.status === 'warning' ? 'Check' : 'Needs attention'}
                </span>
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
        {!readiness.pass && <div className="warning-box" role="alert">Activation is blocked until every required readiness check passes.</div>}
        <div className="notice-box">
          Outcome: Demo workflow activated
        </div>
        <div className="buttons-row">
          <button
            type="button"
            className="primary-button compact"
            disabled={!readiness.pass || missionState.status === 'completed'}
            onClick={() => {
              if (!readiness.pass) {
                updateCurrentStep(5)
                addEvent({
                  eventName: 'Validation failed',
                  missionId,
                  dedupeKey: `validation-failed-${missionId}-${Date.now()}`,
                  properties: { blockedChecks: readiness.checks.filter((check) => check.status === 'blocked').map((check) => check.id) },
                  category: 'Validation',
                })
                return
              }
              const confirmed = window.confirm('Confirm demo activation? No real messages will be sent.')
              if (!confirmed) return
              startMission(missionId)
              activateMission(missionId)
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
      <RecommendationStrip state={state} />
      <div className="mission-detail-page">
        <section className="detail-head-section">
          <div>
            <p className="eyebrow">Mission detail</p>
            <h1>{mission.title}</h1>
          </div>
          <div className="detail-meta-group">
            <span className="status-pill subtle">{formatMissionStatus(missionState.status)}</span>
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
                disabled={index > stepIndex + 1 || (index === 6 && !readiness.pass)}
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
                disabled={stepIndex === 5 && !readiness.pass}
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

function CampaignPerformanceJourney({
  state,
  mission,
  missionState,
  config,
  updateMissionConfig,
  updateMissionState,
  startMission,
  completeMission,
}) {
  const configData = {
    campaignId: config.campaignId || simulatedCampaigns[0].id,
    observation: config.observation || '',
    nextAction: config.nextAction || '',
    currentStep: Math.min(3, Math.max(0, Number(config.currentStep) || 0)),
  }
  const selected = simulatedCampaigns.find((campaign) => campaign.id === configData.campaignId)
  const observation = getCampaignObservation(simulatedCampaigns, configData.campaignId)
  const [notice, setNotice] = useState('')
  const steps = ['Choose a campaign', 'Compare results', 'Find an observation', 'Plan next action']

  const save = (patch) => updateMissionConfig(mission.id, patch)
  const advance = (step) => {
    save({ currentStep: step })
    if (missionState.status !== 'completed') {
      updateMissionState(mission.id, {
        progress: Math.max(missionState.progress || 0, Math.round((step / 3) * 90)),
      })
    }
  }

  const handleComplete = () => {
    if (!configData.observation || configData.nextAction.trim().length < 10) {
      setNotice('Choose a data-backed observation and write a next action of at least 10 characters.')
      return
    }
    const confirmed = window.confirm('Complete this demo mission? Campaign figures are simulated and no campaign will be changed.')
    if (!confirmed) return
    completeMission(mission.id, {
      campaignId: configData.campaignId,
      observation: configData.observation,
      nextAction: configData.nextAction.trim(),
    })
    setNotice('Mission completed. This records a demo learning outcome, not a real business result.')
  }

  return (
    <div className="page-stack">
      <RecommendationStrip state={state} />
      <div className="mission-detail-page">
        <section className="detail-head-section">
          <div>
            <p className="eyebrow">Campaign performance · simulated sample data</p>
            <h1>{mission.title}</h1>
            <p className="lede">Compare fictional GlowCart campaign results and turn one observation into a documented next step.</p>
          </div>
          <span className={`status-pill subtle ${missionState.status === 'completed' ? 'completed' : ''}`}>
            {formatMissionStatus(missionState.status)}
          </span>
        </section>

        <div className="campaign-journey-layout">
          <nav className="stepper campaign-stepper" aria-label="Campaign review steps">
            {steps.map((step, index) => (
              <button
                type="button"
                key={step}
                className={`stepper-item ${configData.currentStep === index ? 'active' : ''} ${configData.currentStep > index ? 'done' : ''}`}
                onClick={() => {
                  if (index <= configData.currentStep) advance(index)
                }}
                disabled={index > configData.currentStep}
                aria-current={configData.currentStep === index ? 'step' : undefined}
              >
                <span>{index + 1}</span>{step}
              </button>
            ))}
          </nav>

          <section className="builder-card campaign-journey-card">
            <div className="builder-card-header">
              <p className="eyebrow">Step {configData.currentStep + 1} of {steps.length}</p>
              <h2>{steps[configData.currentStep]}</h2>
            </div>

            {configData.currentStep === 0 && (
              <div className="builder-step">
                <p>Choose one of these fictional campaign examples to review.</p>
                <div className="campaign-choice-list">
                  {simulatedCampaigns.map((campaign) => (
                    <button
                      type="button"
                      key={campaign.id}
                      className={`choice-card ${configData.campaignId === campaign.id ? 'selected' : ''}`}
                      onClick={() => save({ campaignId: campaign.id, observation: '', nextAction: '' })}
                      aria-pressed={configData.campaignId === campaign.id}
                    >
                      <span className="choice-title">{campaign.name}</span>
                      <span className="choice-description">
                        Simulated · {campaign.sent.toLocaleString()} sent · {campaign.conversions} attributed conversions
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="primary-button compact align-self-start"
                  onClick={() => {
                    startMission(mission.id)
                    advance(1)
                  }}
                >
                  Review selected campaign
                  <ArrowRight size={15} />
                </button>
              </div>
            )}

            {configData.currentStep === 1 && selected && (
              <div className="builder-step">
                <div className="notice-box">All figures below are simulated example data, not real Cheerio or GlowCart results.</div>
                <div className="table-scroll">
                  <table className="data-table">
                    <caption>Simulated campaign comparison. Conversion rate = conversions ÷ delivered.</caption>
                    <thead>
                      <tr><th scope="col">Campaign</th><th scope="col">Delivered</th><th scope="col">Clicks</th><th scope="col">Conversions</th><th scope="col">Conversion rate</th></tr>
                    </thead>
                    <tbody>
                      {simulatedCampaigns.map((campaign) => {
                        const metrics = getCampaignMetrics(campaign)
                        return (
                          <tr key={campaign.id} className={campaign.id === configData.campaignId ? 'selected-row' : ''}>
                            <th scope="row">{campaign.name}{campaign.id === configData.campaignId ? ' · selected' : ''}</th>
                            <td>{campaign.delivered.toLocaleString()}</td>
                            <td>{campaign.clicks.toLocaleString()}</td>
                            <td>{campaign.conversions}</td>
                            <td>{metrics.conversionRate.toFixed(1)}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="notice-box"><strong>Data-supported observation:</strong> {observation.statement}</div>
                <div className="buttons-row">
                  <button type="button" className="secondary-button" onClick={() => advance(0)}>Back</button>
                  <button type="button" className="primary-button compact" onClick={() => advance(2)}>Choose an observation</button>
                </div>
              </div>
            )}

            {configData.currentStep === 2 && observation && (
              <div className="builder-step">
                <p>Select an observation supported by the comparison above.</p>
                {observation.options.map((option) => (
                  <label className="radio-choice" key={option}>
                    <input
                      type="radio"
                      name="campaign-observation"
                      value={option}
                      checked={configData.observation === option}
                      onChange={() => save({ observation: option, nextAction: '' })}
                    />
                    <span>{option}</span>
                  </label>
                ))}
                <div className="buttons-row">
                  <button type="button" className="secondary-button" onClick={() => advance(1)}>Back</button>
                  <button
                    type="button"
                    className="primary-button compact"
                    disabled={!configData.observation}
                    onClick={() => advance(3)}
                  >
                    Document next action
                  </button>
                </div>
              </div>
            )}

            {configData.currentStep === 3 && observation && (
              <div className="builder-step">
                <div className="notice-box"><strong>Selected observation:</strong> {configData.observation || 'Choose one in the previous step.'}</div>
                <div className="notice-box">
                  <strong>Suggested action from the data:</strong> {observation.recommendation}
                </div>
                <label className="field-label" htmlFor="campaign-next-action">What will GlowCart try next?</label>
                <textarea
                  id="campaign-next-action"
                  className="message-textarea"
                  value={configData.nextAction}
                  maxLength={500}
                  onChange={(event) => save({ nextAction: event.target.value })}
                  placeholder="For example: Test the Hydration Week offer with the cart-recovery audience."
                  aria-describedby="campaign-action-help"
                />
                <small id="campaign-action-help">{configData.nextAction.length}/500 characters · At least 10 characters required.</small>
                {notice && <div className="warning-box" role="status">{notice}</div>}
                {missionState.status === 'completed' && (
                  <div className="success-box" role="status">Mission complete in demo. This is a documented learning exercise, not verified real-world adoption.</div>
                )}
                <div className="buttons-row">
                  <button type="button" className="secondary-button" onClick={() => advance(2)}>Back</button>
                  <button
                    type="button"
                    className="primary-button compact"
                    disabled={missionState.status === 'completed' || configData.nextAction.trim().length < 10}
                    onClick={handleComplete}
                  >
                    Complete mission
                    <CheckCircle2 size={15} />
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function ProgressPage() {
  const { state } = useAppState()
  const missions = Object.values(state.missions)
  const startedCount = missions.filter((mission) => mission.startedAt).length
  const setupCompletedCount = missions.filter((mission) => mission.setupCompletedAt || mission.completedAt).length
  const activatedCount = missions.filter((mission) => mission.activatedAt).length
  const repeatUsageCount = state.activity.filter((event) => (
    !event.isHistorical && event.eventName === 'Repeat usage recorded'
  )).length
  const completionRate = startedCount ? Math.round((setupCompletedCount / startedCount) * 100) : 0
  const recommendation = getRecommendedMission(state)
  const currentActivity = state.activity.filter((event) => !event.isHistorical)

  return (
    <div className="page-stack">
      <section className="page-header-row">
        <div>
          <p className="eyebrow">My progress</p>
          <h1>Demo mission progress</h1>
        </div>
      </section>

      <RecommendationStrip state={state} />

      <div className="metric-grid">
        <MetricCard label="Missions started" value={String(startedCount)} icon={ListTodo} description="Unique demo missions with a start timestamp." />
        <MetricCard label="Setup completed" value={String(setupCompletedCount)} icon={CheckCircle2} description="Demo setup journeys marked complete." />
        <MetricCard label="Demo activations" value={String(activatedCount)} icon={Workflow} description="Simulated workflows only; not real feature adoption." />
        <MetricCard label="Completion rate" value={startedCount ? `${completionRate}%` : '—'} icon={TrendingUp} description="Setup-completed missions ÷ missions started." />
      </div>
      <p className="subtle-note">Demo activation does not prove that a feature was adopted or used in production. Repeat usage recorded in this demo: {repeatUsageCount}.</p>

      <section className="mission-progress-grid" aria-label="Mission status">
        {missionCatalog.map((mission) => {
          const missionState = state.missions[mission.id]
          return (
            <article className="mission-progress-card" key={mission.id}>
              <div className="mission-card-top">
                <strong>{mission.title}</strong>
                <span>{formatMissionStatus(missionState.status)}</span>
              </div>
              <div className="progress-mini" role="progressbar" aria-label={`${mission.title} setup progress`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={missionState.progress}>
                <div className="bar" style={{ width: `${missionState.progress}%` }} />
              </div>
            </article>
          )
        })}
      </section>

      <div className="two-column-grid">
        <div className="card-block">
          <h3>Recent demo activity</h3>
          {currentActivity.length ? <div className="timeline-list">
            {currentActivity.slice(0, 6).map((event) => (
              <div key={event.id} className="timeline-item">
                <div className="timeline-dot" />
                <div>
                  <div className="timeline-title">{humanEventName(event.eventName)}</div>
                  <div className="timeline-subtitle">{getMissionTitle(event.missionId)} · {formatTimestamp(event.timestamp)}</div>
                </div>
              </div>
            ))}
          </div> : <p className="empty-copy">No current-demo activity yet. Start a mission to begin tracking your progress.</p>}
        </div>
        <div className="card-block">
          <h3>Progress definitions</h3>
          <ul className="definition-list">
            <li><strong>Started:</strong> a mission has a saved start timestamp.</li>
            <li><strong>Setup completed:</strong> the demo journey was submitted successfully.</li>
            <li><strong>Demo activation:</strong> a simulated workflow was confirmed; no messages were sent.</li>
            <li><strong>Repeat usage:</strong> a separate repeat-use demo event, not real production usage.</li>
          </ul>
          {recommendation && <p className="subtle-note">Next mission: {recommendation.title}</p>}
        </div>
      </div>
    </div>
  )
}

function InsightsPage() {
  const { state } = useAppState()
  const funnel = calculateFunnel({ activity: state.activity })
  const funnelData = funnel.rows.map((row, index) => ({
    name: row.name,
    value: row.value,
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

      <RecommendationStrip state={state} />

      <p className="subtle-note">Historical funnel totals below are simulated aggregate sample data. Current-demo counts are calculated only from events generated in this browser session and are not production adoption telemetry.</p>

      <div className="insight-columns">
        <div className="card-block chart-card">
          <h3>Simulated historical funnel</h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="value" data={funnelData} isAnimationActive={false}>
                  <LabelList position="right" fill="var(--text)" stroke="none" dataKey="name" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-block chart-card">
          <h3>Simulated weekly trends</h3>
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
        <h3>Funnel detail · simulated historical sample</h3>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr><th scope="col">Stage</th><th scope="col">Historical events</th><th scope="col">Conversion from prior</th><th scope="col">Drop-off from prior</th><th scope="col">Current demo events</th></tr>
            </thead>
            <tbody>
              {funnel.rows.map((row) => (
                <tr key={row.id}>
                  <th scope="row">{row.name}</th>
                  <td>{row.value.toLocaleString()}</td>
                  <td>{row.conversion === null ? '—' : `${row.conversion.toFixed(1)}%`}</td>
                  <td>{row.dropOff === null ? '—' : `${row.dropOff.toFixed(1)}%`}</td>
                  <td>{row.currentCount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-block">
        <h3>Recommended product improvement</h3>
        <div className="insight-guide">
          <div>
            <strong>Measured historical bottleneck</strong>
            <p>{funnel.bottleneck
              ? `${funnel.bottleneck.name}: ${funnel.bottleneck.dropOff.toFixed(1)}% drop-off from the preceding stage (${funnel.bottleneck.value} of ${funnel.rows[funnel.rows.indexOf(funnel.bottleneck) - 1]?.value} events continued).`
              : 'There is not enough historical data with non-zero denominators to identify a bottleneck.'}</p>
          </div>
          <div>
            <strong>{funnel.improvement.title}</strong>
            <p>{funnel.improvement.action}</p>
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

      <RecommendationStrip state={state} />

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
                <strong>{humanEventName(event.eventName)}</strong>
                <span>{event.isHistorical ? 'Simulated history' : 'Current demo'}</span>
              </div>
              <div className="timeline-subtitle">{getMissionTitle(event.missionId)} · {formatTimestamp(event.timestamp)} · {event.category}</div>
              <p className="event-context">{describeEvent(event)}</p>
              {event.properties && Object.keys(event.properties).length > 0 && (
                <details className="raw-event-details">
                  <summary>Show event details</summary>
                  <pre>{JSON.stringify(event.properties, null, 2)}</pre>
                </details>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="empty-copy">No activity matches these filters. Try a different mission or event category.</p>}
      </div>
    </div>
  )
}

function SettingsPage() {
  const { state, updateBusiness, updateSettings, resetDemo } = useAppState()
  const [audienceError, setAudienceError] = useState('')
  const [settingsMessage, setSettingsMessage] = useState('')
  const [audienceInput, setAudienceInput] = useState(String(state.settings.audienceSize))

  const handleReset = () => {
    const confirmed = window.confirm('Reset the demo application to its original state?')
    if (confirmed) {
      resetDemo()
      setAudienceError('')
      setSettingsMessage('Demo data restored to its original sample state.')
      setAudienceInput(String(defaultSettings.audienceSize))
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

      <RecommendationStrip state={state} />
      {settingsMessage && <div className="success-box" role="status">{settingsMessage}</div>}

      <div className="settings-grid">
        <div className="card-block">
          <h3>Business</h3>
          <p className="subtle-note">Changes save automatically and update the shared recommendation and readiness state.</p>
          <label className="field-label" htmlFor="business-goal">Business goal</label>
          <select id="business-goal" className="select-control" value={state.business.goal} onChange={(event) => updateBusiness({ goal: event.target.value })}>
            <option value="sales_recovery">Recover lost sales</option>
            <option value="repeat_purchases">Grow repeat purchases</option>
            <option value="campaign_performance">Improve campaign performance</option>
          </select>

          <label className="field-label" htmlFor="business-category">Business category</label>
          <input id="business-category" className="text-input" required maxLength={80} value={state.business.category} onChange={(event) => updateBusiness({ category: event.target.value.slice(0, 80) })} />
          {!state.business.category.trim() && <small className="field-error" role="alert">Enter a business category.</small>}

          <label className="field-label" htmlFor="business-channel">Primary communication channel</label>
          <input id="business-channel" className="text-input" required maxLength={40} value={state.business.channel} onChange={(event) => updateBusiness({ channel: event.target.value.slice(0, 40) })} />
          {!state.business.channel.trim() && <small className="field-error" role="alert">Enter a primary communication channel.</small>}
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
          <label className="checkbox-row"><input type="checkbox" checked={Boolean(state.settings.integrations.analytics.connected)} onChange={(event) => updateSettings({ integrations: { ...state.settings.integrations, analytics: { ...state.settings.integrations.analytics, connected: event.target.checked } } })} /><span>Campaign analytics connected</span></label>
          <label className="field-label" htmlFor="template-approval">Template approval</label>
          <select id="template-approval" className="select-control" value={state.settings.templateApproval} onChange={(event) => updateSettings({ templateApproval: event.target.value })}>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
          <label className="field-label" htmlFor="audience-size">Demo eligible audience size</label>
          <input
            id="audience-size"
            className="text-input"
            type="number"
            inputMode="numeric"
            min="0"
            max="1000000"
            step="1"
            value={audienceInput}
            aria-invalid={Boolean(audienceError)}
            aria-describedby="audience-size-help"
            onChange={(event) => {
              const value = event.target.value
              setAudienceInput(value)
              const count = Number(value)
              const valid = value !== '' && Number.isInteger(count) && count >= 0 && count <= 1000000
              if (!valid) {
                setAudienceError('Enter a whole number between 0 and 1,000,000.')
                updateSettings({ audienceSize: 0 })
                return
              }
              setAudienceError('')
              updateSettings({ audienceSize: count })
            }}
          />
          <small id="audience-size-help" className={audienceError ? 'field-error' : 'subtle-note'} role={audienceError ? 'alert' : undefined}>
            {audienceError || 'Use 0 to demonstrate an empty-audience readiness block. This number is fictional demo data.'}
          </small>
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

function RecommendationStrip({ state }) {
  const { startMission } = useAppState()
  const recommendation = getRecommendedMission(state)
  if (!recommendation) {
    return (
      <div className="recommendation-strip completed-strip">
        <CheckCircle2 size={17} />
        <span>All available demo missions are complete.</span>
        <Link to="/progress">Review progress</Link>
      </div>
    )
  }
  return (
    <div className="recommendation-strip">
      <div className="recommendation-strip-icon"><Sparkles size={16} /></div>
      <div className="recommendation-strip-copy">
        <span className="eyebrow">Recommended for {businessGoalChoices[state.business.goal] || 'your goal'}</span>
        <strong>{recommendation.title}</strong>
      </div>
      <Link
        to={`/missions/${recommendation.id}`}
        className="secondary-button compact"
        onClick={() => startMission(recommendation.id)}
      >
        {recommendation.nextAction}
        <ArrowRight size={14} />
      </Link>
      {recommendation.readiness === 'needs_attention' && (
        <span className="recommendation-prerequisite-note">Prerequisites need attention</span>
      )}
    </div>
  )
}

function formatMissionStatus(status) {
  const labels = {
    not_started: 'Not started',
    in_progress: 'In progress',
    completed: 'Completed',
  }
  return labels[status] || 'Not started'
}

function getMissionTitle(missionId) {
  return missionCatalog.find((mission) => mission.id === missionId)?.title || 'General activity'
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString()
}

function humanEventName(eventName) {
  const names = {
    'Mission viewed': 'Mission opened',
    'Mission started': 'Mission started',
    'Mission completed': 'Mission completed',
    'Setup step completed': 'Setup step completed',
    'Validation failed': 'Readiness check needs attention',
    'Readiness passed': 'Readiness checks passed',
    'Demo activation confirmed': 'Demo workflow activated',
    'Recommendation dismissed': 'Recommendation dismissed',
    'Settings updated': 'Demo settings updated',
    'Repeat usage recorded': 'Repeat usage recorded in demo',
  }
  return names[eventName] || eventName || 'Activity recorded'
}

function describeEvent(event) {
  const props = event.properties || {}
  if (event.eventName === 'Validation failed' && Array.isArray(props.blockedChecks)) {
    return `${props.blockedChecks.length} readiness check${props.blockedChecks.length === 1 ? '' : 's'} need attention.`
  }
  if (props.campaignId) {
    const campaign = simulatedCampaigns.find((item) => item.id === props.campaignId)
    return campaign
      ? `Reviewed simulated campaign “${campaign.name}”.${props.observation ? ` Observation: ${props.observation}` : ''}`
      : 'Reviewed a simulated campaign.'
  }
  if (event.eventName === 'Demo activation confirmed') {
    return 'A demo workflow was activated. No real messages were sent.'
  }
  if (event.eventName === 'Mission completed') {
    return props.nextAction
      ? `Demo learning recorded. Next action: ${props.nextAction}`
      : 'The demo mission journey was completed.'
  }
  if (event.eventName === 'Mission started') return 'The user began this mission in the demo workspace.'
  if (event.eventName === 'Mission viewed') return 'The mission detail was opened.'
  if (event.eventName === 'Setup step completed') return `Completed the ${props.step || 'setup'} section.`
  if (event.eventName === 'Recommendation dismissed') return 'A sample recommendation was dismissed in simulated history.'
  return event.isHistorical ? 'Seeded simulated history.' : 'Recorded in the current demo session.'
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

function MetricCard({ label, value, icon: Icon, description }) {
  return (
    <div className="metric-card">
      <div className="metric-icon">
        <Icon size={16} />
      </div>
      <div>
        <div className="metric-label">{label}</div>
        <div className="metric-value">{value}</div>
        {description && <div className="metric-description">{description}</div>}
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
