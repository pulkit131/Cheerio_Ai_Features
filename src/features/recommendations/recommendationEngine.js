export function getRecommendedMission(state) {
  const { business, missions, settings } = state
  const completed = Object.values(missions).filter((mission) => mission.status === 'completed').length

  if (business.goal === 'sales_recovery' && !missions['abandoned-cart']?.activatedAt) {
    return {
      id: 'abandoned-cart',
      title: 'Recover more abandoned carts',
      rationale: 'Demo account conditions: GlowCart already sends WhatsApp campaigns, there is no cart-recovery automation configured, and your business goal is sales recovery.',
      reasonCodes: ['goal_match', 'channel_fit', 'workflow_gap'],
      capabilities: ['WhatsApp campaigns', 'Audience targeting', 'Message timing'],
      prerequisites: ['WhatsApp connected', 'Cart activity available'],
      effort: '5 minutes',
      priority: 97,
      nextAction: 'Start mission',
    }
  }

  if (business.goal === 'repeat_purchases' && !missions['repeat-purchase']?.completedAt) {
    return {
      id: 'repeat-purchase',
      title: 'Create a repeat-purchase segment',
      rationale: 'Your current goal points to improving repeat purchases and this mission turns purchase behavior into a more relevant audience.',
      reasonCodes: ['repeat_purchase_goal', 'segment_gap'],
      capabilities: ['Customer segmentation', 'CRM logic', 'Follow-up flows'],
      prerequisites: ['Purchase data available', 'Audience saved'],
      effort: '10 minutes',
      priority: 92,
      nextAction: 'Explore segment setup',
    }
  }

  if (settings.recommendationPreferences?.analytics && !missions['campaign-performance']?.activatedAt) {
    return {
      id: 'campaign-performance',
      title: 'Understand campaign performance',
      rationale: 'GlowCart has been sending campaigns manually, but performance data has not been translated into a follow-up optimization workflow yet.',
      reasonCodes: ['manual_campaigns', 'analytics_gap'],
      capabilities: ['Campaign analytics', 'Performance review', 'Optimization planning'],
      prerequisites: ['Recent campaign history', 'Message analytics enabled'],
      effort: '7 minutes',
      priority: 80,
      nextAction: 'Review campaign trends',
    }
  }

  if (completed > 0 && !missions['repeat-purchase']?.activatedAt) {
    return {
      id: 'repeat-purchase',
      title: 'Create a repeat-purchase segment',
      rationale: 'A completed recovery flow is the right moment to turn customer behavior into a retention loop.',
      reasonCodes: ['post_activation_next_step'],
      capabilities: ['Customer segmentation', 'Repeat-purchase logic'],
      prerequisites: ['Purchase history', 'Retention goals'],
      effort: '10 minutes',
      priority: 75,
      nextAction: 'Set up the next step',
    }
  }

  return {
    id: 'abandoned-cart',
    title: 'Recover more abandoned carts',
    rationale: 'This remains the highest-fit mission for your current focus on sales recovery and WhatsApp-led customer follow-up.',
    reasonCodes: ['default_recommendation'],
    capabilities: ['WhatsApp campaigns', 'Cart follow-up'],
    prerequisites: ['WhatsApp connected'],
    effort: '5 minutes',
    priority: 70,
    nextAction: 'Start mission',
  }
}
