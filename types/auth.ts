export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: 'admin' | 'member') => Promise<void>;
  logout: () => void;
}
