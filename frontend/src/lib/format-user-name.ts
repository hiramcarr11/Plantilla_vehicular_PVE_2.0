import type { User } from '../types';

export function formatUserName(user?: Pick<User, 'fullName' | 'firstName' | 'lastName'> | null) {
  if (!user) {
    return '-';
  }

  if (user.fullName?.trim()) {
    return user.fullName.trim();
  }

  const fullName = [user.firstName, user.lastName]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ');

  return fullName || '-';
}
