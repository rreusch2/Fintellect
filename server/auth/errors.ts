export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export const AUTH_ERRORS = {
  GOOGLE_AUTH_FAILED: new AuthError(
    'Google authentication failed',
    'GOOGLE_AUTH_FAILED',
    401
  ),
  USER_EXISTS: new AuthError(
    'A user with this email already exists',
    'USER_EXISTS',
    409
  ),
}; 