export function pickUserSafeFields(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

export function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
