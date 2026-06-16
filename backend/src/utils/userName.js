export function formatUserName(user) {
  if (!user) return '';
  return [user.lastName, user.firstName, user.middleName].filter(Boolean).join(' ');
}
