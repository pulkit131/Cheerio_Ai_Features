export function evaluateReadiness({ missionId, config = {}, settings = {} }) {
  const checks = [
    {
      id: 'trigger',
      label: 'Trigger selected',
      status: config.trigger ? 'pass' : 'blocked',
      explanation: config.trigger ? 'The trigger matches the selected workflow.' : 'Choose a trigger before continuing.',
      fix: 'Pick a trigger in step 1.',
    },
    {
      id: 'audience',
      label: 'Audience available',
      status: Number(settings.audienceSize || 0) > 0 ? 'pass' : 'blocked',
      explanation: Number(settings.audienceSize || 0) > 0 ? 'There are eligible customers in the demo audience.' : 'The audience is empty, so the workflow cannot be ready.',
      fix: 'Increase the demo audience size or select a valid segment.',
    },
    {
      id: 'timing',
      label: 'Timing selected',
      status: config.timing ? 'pass' : 'blocked',
      explanation: config.timing ? 'Follow-up timing is configured.' : 'Choose a delay for the message.',
      fix: 'Select a delay in step 3.',
    },
    {
      id: 'message',
      label: 'Message content valid',
      status: (() => {
        const text = config.message || ''
        const hasName = /\{\{first_name\}\}/.test(text)
        const hasLink = /\{\{cart_link\}\}/.test(text)
        if (!text.trim()) return 'blocked'
        if (!hasName || !hasLink) return 'blocked'
        return 'pass'
      })(),
      explanation: (() => {
        const text = config.message || ''
        if (!text.trim()) return 'The message is empty. Add a follow-up message.'
        if (!/\{\{first_name\}\}/.test(text) || !/\{\{cart_link\}\}/.test(text)) return 'Required placeholders are missing.'
        return 'Message content includes the required placeholders.'
      })(),
      fix: 'Include {{first_name}} and {{cart_link}} in the message.',
    },
    {
      id: 'templateApproval',
      label: 'Template approval',
      status: settings.templateApproval === 'approved' ? 'pass' : 'blocked',
      explanation: settings.templateApproval === 'approved' ? 'Demo template approval is complete.' : 'The message template is still pending approval.',
      fix: 'Approve the demo message template in Settings.',
    },
    {
      id: 'integration',
      label: 'Integration connected',
      status: settings.integrations?.whatsapp?.connected ? 'pass' : 'blocked',
      explanation: settings.integrations?.whatsapp?.connected ? 'The WhatsApp business connection is live in the demo.' : 'The required WhatsApp integration is disconnected.',
      fix: 'Reconnect WhatsApp in Settings.',
    },
    {
      id: 'review',
      label: 'Review confirmation',
      status: config.reviewConfirmed ? 'pass' : 'blocked',
      explanation: config.reviewConfirmed ? 'The user has reviewed the configuration.' : 'Confirmation is required before readiness checks can pass.',
      fix: 'Check the review box in step 5.',
    },
  ]

  const passCount = checks.filter((check) => check.status === 'pass').length
  const hasBlocking = checks.some((check) => check.status === 'blocked')

  return {
    missionId,
    checks,
    pass: !hasBlocking,
    passCount,
    totalChecks: checks.length,
  }
}
