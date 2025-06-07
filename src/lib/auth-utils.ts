
// Helper function to extract userId from placeholder token
// In a real app, this would involve proper JWT validation.
export function getUserIdFromToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[Auth Utils] Authorization header missing or not Bearer type.');
    return null;
  }

  const token = authHeader.split(' ')[1];
  // Placeholder token formats used in AuthContext
  const prefixes = ["mock-jwt-token-for-", "whmcs-session-for-"];
  
  for (const prefix of prefixes) {
    if (token.startsWith(prefix)) {
      const userId = token.replace(prefix, '');
      if (userId) {
        return userId;
      }
    }
  }
  console.warn('[Auth Utils] Token format not recognized or userId missing.');
  return null;
}
