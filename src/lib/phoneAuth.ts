import {
  signInWithPhoneNumber,
  type ApplicationVerifier,
  type ConfirmationResult,
} from 'firebase/auth';

import { firebaseAuth } from './firebase';
import { indianE164 } from './phoneAuthUtils';

export { firebaseAuthMessage, indianE164 } from './phoneAuthUtils';

export async function sendFirebasePhoneOtp(
  phone: string,
  verifier: ApplicationVerifier,
): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(firebaseAuth, indianE164(phone), verifier);
}

export async function confirmFirebasePhoneOtp(
  confirmation: ConfirmationResult,
  otp: string,
): Promise<string> {
  const result = await confirmation.confirm(otp.trim());
  return result.user.getIdToken();
}
