import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Login - Task Manager',
  description: 'Sign in to your task management account',
};

export default function LoginPage() {
  return <LoginForm />;
}
