import { funnelStages } from '../../data/demoData.js'

const eventStage = {
  'Mission viewed': 'impression',
  'Recommendation viewed': 'impression',
  'Mission started': 'started',
  'Setup completed': 'setup',
  'Mission completed': 'setup',
  'Readiness passed': 'ready',
  'Demo activation confirmed': 'activated',
  'Repeat usage recorded': 'repeat',
}

const improvementByStage = {
  started: {
    title: 'Make the first mission step easier to start',
    action: 'Shorten the introduction and surface the first setup action directly from the recommendation.',
  },
  setup: {
    title: 'Reduce friction in the guided setup',
    action: 'Review the setup steps and move prerequisite checks earlier so users can resolve blockers before investing time.',
  },
  ready: {
    title: 'Resolve readiness blockers earlier',
    action: 'Surface integration, audience, and template status before the final review to prevent late-stage blockers.',
  },
  activated: {
    title: 'Make demo activation more reassuring',
    action: 'Explain the demo-only outcome and what it does—and does not—mean before the confirmation step.',
  },
  repeat: {
    title: 'Create a clear reason to return',
    action: 'Offer an explicit follow-up mission after setup; this demo repeat-usage stage is not proof of production feature use.',
  },
}

export function calculateFunnel({ activity = [], historical = funnelStages } = {}) {
  const currentCounts = Object.fromEntries(funnelStages.map((stage) => [stage.id, 0]))
  for (const event of activity) {
    if (!event || event.isHistorical || event.eventSource === 'simulated-history') continue
    const stageId = eventStage[event.eventName]
    if (stageId) currentCounts[stageId] += 1
  }

  const rows = historical.map((stage, index) => {
    const previous = index > 0 ? historical[index - 1].value : null
    const hasDenominator = previous !== null && previous > 0
    const dropOff = hasDenominator
      ? Math.max(0, ((previous - stage.value) / previous) * 100)
      : null
    const conversion = hasDenominator ? (stage.value / previous) * 100 : null

    return {
      ...stage,
      conversion,
      dropOff,
      currentCount: currentCounts[stage.id] || 0,
    }
  })

  const measuredStages = rows.slice(1).filter((row) => row.dropOff !== null)
  const bottleneck = measuredStages.reduce((largest, row) => (
    !largest || row.dropOff > largest.dropOff ? row : largest
  ), null)

  return {
    rows,
    bottleneck,
    improvement: improvementByStage[bottleneck?.id] || improvementByStage.started,
    currentCounts,
  }
}

export function getCampaignMetrics(campaign) {
  if (!campaign || campaign.delivered <= 0) {
    return { clickRate: 0, conversionRate: 0, deliveryRate: 0 }
  }
  return {
    clickRate: campaign.clicks / campaign.delivered * 100,
    conversionRate: campaign.conversions / campaign.delivered * 100,
    deliveryRate: campaign.sent > 0 ? campaign.delivered / campaign.sent * 100 : 0,
  }
}

export function getCampaignObservation(campaigns, selectedId) {
  const selected = campaigns.find((campaign) => campaign.id === selectedId)
  if (!selected) return null
  const ranked = campaigns
    .map((campaign) => ({ campaign, ...getCampaignMetrics(campaign) }))
    .sort((left, right) => right.conversionRate - left.conversionRate)
  const rank = ranked.findIndex((item) => item.campaign.id === selectedId) + 1
  const best = ranked[0]
  const worst = ranked[ranked.length - 1]
  const selectedMetrics = getCampaignMetrics(selected)

  return {
    selected,
    rank,
    best,
    worst,
    selectedMetrics,
    statement: selected.id === best.campaign.id
      ? `${selected.name} leads the simulated campaigns at ${selectedMetrics.conversionRate.toFixed(1)}% conversion (conversions ÷ delivered).`
      : `${selected.name} converts at ${selectedMetrics.conversionRate.toFixed(1)}%, below the ${best.campaign.name} leader at ${best.conversionRate.toFixed(1)}%.`,
    recommendation: selected.id === best.campaign.id
      ? 'Use this campaign as the comparison baseline when planning the next message test.'
      : `Review the offer and audience in ${selected.name}; compare its message with ${best.campaign.name}, which currently has the strongest conversion rate.`,
    options: [
      `${best.campaign.name} has the highest conversion rate (${best.conversionRate.toFixed(1)}%).`,
      `${worst.campaign.name} has the lowest conversion rate (${worst.conversionRate.toFixed(1)}%).`,
      `${selected.name} is ranked ${rank} of ${ranked.length} by conversion rate.`,
    ],
  }
}
