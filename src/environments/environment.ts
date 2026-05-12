export const environment = {
  production: true,
  // Use relative paths in production so the deployment (Vercel) can proxy /api/* to the real API.
  // This avoids baking the external API hostname into the build artifacts.
  apiUrl: '',
  tokenKey: 'auth_token',
  refreshTokenKey: 'refresh_token'
};
