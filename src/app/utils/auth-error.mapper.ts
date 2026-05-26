export interface AuthErrorLike {
  code?: string;
  message?: string;
  status?: number;
}

const AUTH_ERROR_KEYS: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'AUTH.ERRORS.INVALID_CREDENTIALS',
  INVALID_PASSWORD: 'AUTH.ERRORS.INVALID_PASSWORD',
  INVALID_EMAIL: 'AUTH.ERRORS.INVALID_EMAIL',
  USER_NOT_FOUND: 'AUTH.ERRORS.USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'AUTH.ERRORS.USER_ALREADY_EXISTS',
  EMAIL_NOT_VERIFIED: 'AUTH.ERRORS.EMAIL_NOT_VERIFIED',
  PASSWORD_TOO_SHORT: 'AUTH.ERRORS.PASSWORD_TOO_SHORT',
  PASSWORD_TOO_LONG: 'AUTH.ERRORS.WEAK_PASSWORD',
  TOO_MANY_REQUESTS: 'AUTH.ERRORS.TOO_MANY_REQUESTS',
  invalid_credentials: 'AUTH.ERRORS.INVALID_CREDENTIALS',
  user_already_exists: 'AUTH.ERRORS.USER_ALREADY_EXISTS',
  email_exists: 'AUTH.ERRORS.USER_ALREADY_EXISTS',
  email_address_invalid: 'AUTH.ERRORS.INVALID_EMAIL',
  weak_password: 'AUTH.ERRORS.WEAK_PASSWORD',
  user_not_found: 'AUTH.ERRORS.USER_NOT_FOUND',
  email_not_confirmed: 'AUTH.ERRORS.EMAIL_NOT_VERIFIED',
  over_request_rate_limit: 'AUTH.ERRORS.TOO_MANY_REQUESTS',
  session_expired: 'AUTH.ERRORS.SESSION_EXPIRED',
  session_not_found: 'AUTH.ERRORS.SESSION_NOT_FOUND',
};

const MESSAGE_FALLBACKS: [RegExp, string][] = [
  [/invalid email or password/i, 'AUTH.ERRORS.INVALID_CREDENTIALS'],
  [/invalid login|incorrect|wrong password/i, 'AUTH.ERRORS.INVALID_CREDENTIALS'],
  [/user already exists|already registered/i, 'AUTH.ERRORS.USER_ALREADY_EXISTS'],
  [/email already|email exists/i, 'AUTH.ERRORS.USER_ALREADY_EXISTS'],
  [/invalid email/i, 'AUTH.ERRORS.INVALID_EMAIL'],
  [/password.*(short|weak|requirements)/i, 'AUTH.ERRORS.PASSWORD_TOO_SHORT'],
  [/too many|rate limit/i, 'AUTH.ERRORS.TOO_MANY_REQUESTS'],
  [/email not confirmed|email verification/i, 'AUTH.ERRORS.EMAIL_NOT_VERIFIED'],
  [/user not found/i, 'AUTH.ERRORS.USER_NOT_FOUND'],
];

function lookupCode(code: string): string | undefined {
  if (AUTH_ERROR_KEYS[code]) return AUTH_ERROR_KEYS[code];
  const upper = code.toUpperCase();
  if (AUTH_ERROR_KEYS[upper]) return AUTH_ERROR_KEYS[upper];
  const snake = code.toLowerCase().replace(/-/g, '_');
  if (AUTH_ERROR_KEYS[snake]) return AUTH_ERROR_KEYS[snake];
  return undefined;
}

function extractAuthError(error: unknown): AuthErrorLike {
  if (!error) return {};
  if (typeof error === 'string') return { message: error };

  if (error instanceof Error) {
    const e = error as Error & { code?: string; status?: number };
    return { code: e.code, message: e.message, status: e.status };
  }

  if (typeof error === 'object') {
    const e = error as Record<string, unknown>;
    let code = typeof e['code'] === 'string' ? e['code'] : undefined;
    let message = typeof e['message'] === 'string' ? e['message'] : undefined;
    let status = typeof e['status'] === 'number' ? e['status'] : undefined;

    const body = e['body'];
    if (body && typeof body === 'object') {
      const b = body as Record<string, unknown>;
      code = code ?? (typeof b['code'] === 'string' ? b['code'] : undefined);
      message = message ?? (typeof b['message'] === 'string' ? b['message'] : undefined);
    }

    return { code, message, status };
  }

  return {};
}

export function getAuthErrorKey(error: unknown): string {
  const parsed = extractAuthError(error);

  if (parsed.code) {
    const key = lookupCode(parsed.code);
    if (key) return key;
  }

  if (parsed.status === 401) {
    return 'AUTH.ERRORS.INVALID_CREDENTIALS';
  }

  const msg = parsed.message ?? '';
  for (const [pattern, key] of MESSAGE_FALLBACKS) {
    if (pattern.test(msg)) return key;
  }

  return 'AUTH.ERRORS.GENERIC';
}
