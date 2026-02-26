import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata = {
  title: 'Register - Task Manager',
  description: 'Create a new task management account',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
