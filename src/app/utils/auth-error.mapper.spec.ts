import { getAuthErrorKey } from './auth-error.mapper';

describe('auth-error.mapper', () => {
  it('should map known error codes', () => {
    expect(getAuthErrorKey({ code: 'USER_ALREADY_EXISTS' })).toBe(
      'AUTH.ERRORS.USER_ALREADY_EXISTS',
    );
    expect(getAuthErrorKey({ code: 'invalid_credentials' })).toBe(
      'AUTH.ERRORS.INVALID_CREDENTIALS',
    );
  });

  it('should map 401 status to invalid credentials', () => {
    expect(getAuthErrorKey({ status: 401 })).toBe('AUTH.ERRORS.INVALID_CREDENTIALS');
  });

  it('should map message patterns when code is missing', () => {
    expect(getAuthErrorKey({ message: 'Invalid email or password' })).toBe(
      'AUTH.ERRORS.INVALID_CREDENTIALS',
    );
    expect(getAuthErrorKey({ message: 'User already exists' })).toBe(
      'AUTH.ERRORS.USER_ALREADY_EXISTS',
    );
    expect(getAuthErrorKey({ message: 'Too many requests' })).toBe(
      'AUTH.ERRORS.TOO_MANY_REQUESTS',
    );
  });

  it('should extract nested body fields', () => {
    expect(
      getAuthErrorKey({
        body: { code: 'email_not_confirmed', message: 'Verify your email' },
      }),
    ).toBe('AUTH.ERRORS.EMAIL_NOT_VERIFIED');
  });

  it('should return generic key for unknown errors', () => {
    expect(getAuthErrorKey(null)).toBe('AUTH.ERRORS.GENERIC');
    expect(getAuthErrorKey({ message: 'Something unexpected' })).toBe(
      'AUTH.ERRORS.GENERIC',
    );
  });

  it('should handle Error instances', () => {
    const err = new Error('user not found') as Error & { code?: string };
    err.code = 'user_not_found';
    expect(getAuthErrorKey(err)).toBe('AUTH.ERRORS.USER_NOT_FOUND');
  });

  it('should map session errors by code', () => {
    expect(getAuthErrorKey({ code: 'session_expired' })).toBe('AUTH.ERRORS.SESSION_EXPIRED');
    expect(getAuthErrorKey({ code: 'session_not_found' })).toBe('AUTH.ERRORS.SESSION_NOT_FOUND');
  });
});
