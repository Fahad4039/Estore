// Local auth — stores users in localStorage. Replace with Firebase when ready.

export interface LocalUser {
  uid: string;
  email: string;
  displayName: string | null;
  createdAt: number;
}

const USERS_KEY = 'estore_users';
const PASSWORDS_KEY = 'estore_passwords';
const SESSION_KEY = 'estore_session';

function getUsers(): LocalUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
  catch { return []; }
}

function getPasswords(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}'); }
  catch { return {}; }
}

export function findUserByEmail(email: string): LocalUser | undefined {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function localRegister(email: string, password: string, displayName?: string): LocalUser {
  if (findUserByEmail(email)) throw new Error('Email already registered. Please sign in.');
  const user: LocalUser = {
    uid: `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    email,
    displayName: displayName || null,
    createdAt: Date.now(),
  };
  const users = getUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  const passwords = getPasswords();
  passwords[email.toLowerCase()] = password;
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
  return user;
}

export function localSignIn(email: string, password: string): LocalUser {
  const user = findUserByEmail(email);
  if (!user) throw new Error('No account found with this email.');
  const passwords = getPasswords();
  if (passwords[email.toLowerCase()] !== password) throw new Error('Incorrect password.');
  localSetSession(user);
  return user;
}

export function localSetSession(user: LocalUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function localGetSession(): LocalUser | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
  catch { return null; }
}

export function localClearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
