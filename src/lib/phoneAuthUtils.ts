export function indianE164(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10);
  return `+91${digits}`;
}

export function firebaseAuthMessage(error: unknown, fallback: string): string {
  const code = (error as { code?: string })?.code;
  if (code === 'auth/invalid-phone-number') {
    return 'That phone number is not valid. Use a 10-digit Indian mobile starting with 6–9.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many OTP requests. Please wait a few minutes and try again.';
  }
  if (code === 'auth/billing-not-enabled') {
    return 'Phone OTP is turned off until Firebase billing is enabled for the keralasellers project. Upgrade that project to the Blaze plan, then try again.';
  }
  if (code === 'auth/invalid-verification-code') {
    return 'The OTP is incorrect or has expired.';
  }
  if (code === 'auth/code-expired' || code === 'auth/session-expired') {
    return 'The OTP has expired. Please send a new one.';
  }
  if (code === 'auth/captcha-check-failed' || code === 'auth/web-storage-unsupported') {
    return 'Security check failed. Complete the reCAPTCHA and try again.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error. Check your connection and try again.';
  }
  const message = (error as { message?: string })?.message;
  return message || fallback;
}
