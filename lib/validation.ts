export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export const validateEmail = (email: string): { isValid: boolean; error: string | null } => {
  if (!email) return { isValid: false, error: null };
  if (!EMAIL_REGEX.test(email)) return { isValid: false, error: 'Please enter a valid email address' };
  return { isValid: true, error: null };
};

export const validateUsername = (username: string): { isValid: boolean; error: string | null } => {
  if (!username) return { isValid: false, error: null };
  if (username.length < 3) return { isValid: false, error: 'Username must be at least 3 characters' };
  if (username.length > 20) return { isValid: false, error: 'Username must be at most 20 characters' };
  if (!USERNAME_REGEX.test(username)) return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
  return { isValid: true, error: null };
};

export const validatePassword = (password: string): { isValid: boolean; error: string | null } => {
  if (!password) return { isValid: false, error: null };
  if (password.length < 6) return { isValid: false, error: 'Password must be at least 6 characters' };
  return { isValid: true, error: null };
};

export const validateConfirmPassword = (password: string, confirmPassword: string): { isValid: boolean; error: string | null } => {
  if (!confirmPassword) return { isValid: false, error: null };
  if (confirmPassword !== password) return { isValid: false, error: 'Passwords do not match' };
  if (password.length < 6) return { isValid: false, error: null };
  return { isValid: true, error: null };
};

