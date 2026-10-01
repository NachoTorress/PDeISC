export type User = {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  createdAt: string;
  linkedProviders: ('google' | 'discord' | 'github')[];
};
export type Session = { token: string; user: User };
export type Purpose = 'verify_email' | 'activate_local' | 'reset_password';
export type Answer = { questionId: number; answer: string };
export type Route = 'login' | 'register' | 'verify' | 'activate' | 'reset' | 'welcome';
