const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface RequestOptions extends RequestInit {
  token?: string;
}

export async function apiCall<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  return response.json();
}

export const authService = {
  login: (email: string, password: string) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string, role: 'admin' | 'member' = 'member') =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    }),
};

export const taskService = {
  createTask: (data: any, token: string) =>
    apiCall('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  getTasks: (filters: Record<string, any> = {}, token: string) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return apiCall(`/tasks?${params}`, { token });
  },

  getTask: (id: string, token: string) =>
    apiCall(`/tasks/${id}`, { token }),

  updateTask: (id: string, data: any, token: string) =>
    apiCall(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),

  deleteTask: (id: string, token: string) =>
    apiCall(`/tasks/${id}`, {
      method: 'DELETE',
      token,
    }),
};
