export function emailErrorMessage(error) {
  if (
    ['over_email_send_rate_limit', 'over_request_rate_limit'].includes(
      error?.code,
    )
  )
    return 'Too many email requests. Please wait a few minutes before trying again.'
  if (
    ['email_address_not_authorized', 'unexpected_failure'].includes(error?.code)
  )
    return 'We could not send the email. Please try again later or contact support.'
  return error?.message || 'Unable to send the email. Please try again.'
}
