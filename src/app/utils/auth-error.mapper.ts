export interface AuthErrorLike {
  code?: string;
  message?: string;
  status?: number;
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Neon / Better Auth API codes
  INVALID_EMAIL_OR_PASSWORD: 'Correo o contraseña incorrectos.',
  INVALID_PASSWORD: 'La contraseña no es válida.',
  INVALID_EMAIL: 'El correo electrónico no es válido.',
  USER_NOT_FOUND: 'No existe una cuenta con este correo.',
  USER_ALREADY_EXISTS: 'Ya existe una cuenta con este correo.',
  EMAIL_NOT_VERIFIED: 'Debes verificar tu correo antes de iniciar sesión.',
  PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres.',
  PASSWORD_TOO_LONG: 'La contraseña es demasiado larga.',
  TOO_MANY_REQUESTS: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',

  // Normalized SDK codes (snake_case)
  invalid_credentials: 'Correo o contraseña incorrectos.',
  user_already_exists: 'Ya existe una cuenta con este correo.',
  email_exists: 'Ya existe una cuenta con este correo.',
  email_address_invalid: 'El correo electrónico no es válido.',
  weak_password: 'La contraseña es demasiado débil.',
  user_not_found: 'No existe una cuenta con este correo.',
  email_not_confirmed: 'Debes verificar tu correo antes de iniciar sesión.',
  over_request_rate_limit: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  over_email_send_rate_limit: 'Demasiados correos enviados. Espera un momento.',
  validation_failed: 'Revisa los datos ingresados.',
  session_expired: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  session_not_found: 'No hay una sesión activa.',
  bad_jwt: 'Sesión no válida. Vuelve a iniciar sesión.',
  unexpected_failure: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
  feature_not_supported: 'Esta función no está disponible.',
};

const MESSAGE_FALLBACKS: [RegExp, string][] = [
  [/invalid email or password/i, 'Correo o contraseña incorrectos.'],
  [/invalid login|incorrect|wrong password/i, 'Correo o contraseña incorrectos.'],
  [/user already exists|already registered/i, 'Ya existe una cuenta con este correo.'],
  [/email already|email exists/i, 'Ya existe una cuenta con este correo.'],
  [/invalid email/i, 'El correo electrónico no es válido.'],
  [/password.*(short|weak|requirements)/i, 'La contraseña debe tener al menos 8 caracteres.'],
  [/too many|rate limit/i, 'Demasiados intentos. Espera un momento e inténtalo de nuevo.'],
  [/email not confirmed|email verification/i, 'Debes verificar tu correo antes de iniciar sesión.'],
  [/user not found/i, 'No existe una cuenta con este correo.'],
];

function lookupCode(code: string): string | undefined {
  if (AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];
  const upper = code.toUpperCase();
  if (AUTH_ERROR_MESSAGES[upper]) return AUTH_ERROR_MESSAGES[upper];
  const snake = code.toLowerCase().replace(/-/g, '_');
  if (AUTH_ERROR_MESSAGES[snake]) return AUTH_ERROR_MESSAGES[snake];
  return undefined;
}

function extractAuthError(error: unknown): AuthErrorLike {
  if (!error) return {};
  if (typeof error === 'string') return { message: error };

  if (error instanceof Error) {
    const e = error as Error & { code?: string; status?: number };
    return {
      code: e.code,
      message: e.message,
      status: e.status,
    };
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

export function mapAuthError(error: unknown): string {
  const parsed = extractAuthError(error);

  if (parsed.code) {
    const mapped = lookupCode(parsed.code);
    if (mapped) return mapped;
  }

  if (parsed.status === 401) {
    return AUTH_ERROR_MESSAGES['invalid_credentials'];
  }

  const msg = parsed.message ?? '';
  for (const [pattern, spanish] of MESSAGE_FALLBACKS) {
    if (pattern.test(msg)) return spanish;
  }

  return 'No se pudo completar la operación. Inténtalo de nuevo.';
}
