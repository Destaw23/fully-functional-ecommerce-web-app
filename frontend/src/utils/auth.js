export function normalizeUser(user) {
  if (!user || typeof user !== 'object') return user;

  const normalized = { ...user };
  const isAdmin = Boolean(
    normalized.isAdmin ||
      normalized.is_admin ||
      normalized.role === 'admin' ||
      normalized.role === 'superadmin' ||
      normalized.is_superuser ||
      normalized.isSuperuser ||
      normalized.is_staff ||
      normalized.isStaff
  );

  normalized.isAdmin = isAdmin;
  normalized.is_admin = isAdmin;
  normalized.is_staff = Boolean(normalized.is_staff || normalized.isStaff || isAdmin);
  normalized.isSuperuser = Boolean(normalized.isSuperuser || normalized.is_superuser || isAdmin);
  normalized.is_superuser = normalized.isSuperuser;

  return normalized;
}

export function isUserAdmin(user) {
  if (!user) return false;
  return Boolean(normalizeUser(user).isAdmin);
}
