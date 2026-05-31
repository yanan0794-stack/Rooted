import type { AuthUser } from './types';
import { USER_AVATAR } from './constants';

const AUTH_KEY = 'rooted_auth';

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function persistUser(user: AuthUser) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  fetch('/api/user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  }).catch(() => {});
}

export function removeUser() {
  localStorage.removeItem(AUTH_KEY);
  fetch('/api/user', { method: 'DELETE' }).catch(() => {});
}

export function mockUser(provider: AuthUser['provider'], email?: string): AuthUser {
  const emails: Record<AuthUser['provider'], string> = {
    google: 'botanist@gmail.com',
    apple: 'botanist@icloud.com',
    x: 'botanist@x.com',
    link: email ?? '',
    email: email ?? 'botanist@grove.app',
  };
  return {
    id: `${provider}-${Date.now()}`,
    name: 'Botanist',
    email: email ?? emails[provider],
    avatar: USER_AVATAR,
    provider,
  };
}
