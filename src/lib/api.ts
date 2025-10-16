const API_BASE = '/api';

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new APIError(error.message || 'Request failed', response.status, error);
  }
  return response.json();
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      }).then(handleResponse),

    logout: () =>
      fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      }).then(handleResponse),

    getMe: () =>
      fetch(`${API_BASE}/auth/me`, {
        credentials: 'include',
      }).then(handleResponse),
  },

  rooms: {
    getAll: () =>
      fetch(`${API_BASE}/rooms`, {
        credentials: 'include',
      }).then(handleResponse),

    getById: (id: string) =>
      fetch(`${API_BASE}/rooms/${id}`, {
        credentials: 'include',
      }).then(handleResponse),

    create: (data: { name: string; mode?: 'screenshare' | 'watchparty'; videoUrl?: string }) =>
      fetch(`${API_BASE}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      }).then(handleResponse),

    update: (id: string, data: { name?: string; mode?: 'screenshare' | 'watchparty'; videoUrl?: string }) =>
      fetch(`${API_BASE}/rooms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      }).then(handleResponse),

    join: (id: string) =>
      fetch(`${API_BASE}/rooms/${id}/join`, {
        method: 'POST',
        credentials: 'include',
      }).then(handleResponse),

    leave: (id: string) =>
      fetch(`${API_BASE}/rooms/${id}/leave`, {
        method: 'POST',
        credentials: 'include',
      }).then(handleResponse),

    transfer: (id: string, newOwnerId: string) =>
      fetch(`${API_BASE}/rooms/${id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newOwnerId }),
      }).then(handleResponse),

    delete: (id: string) =>
      fetch(`${API_BASE}/rooms/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      }).then(handleResponse),
  },

  messages: {
    getByRoomId: (roomId: string) =>
      fetch(`${API_BASE}/rooms/${roomId}/messages`, {
        credentials: 'include',
      }).then(handleResponse),

    send: (roomId: string, data: { content: string; type?: 'text' | 'gif' | 'system'; gifUrl?: string }) =>
      fetch(`${API_BASE}/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      }).then(handleResponse),
  },

  admin: {
    getUsers: () =>
      fetch(`${API_BASE}/admin/users`, {
        credentials: 'include',
      }).then(handleResponse),

    createUser: (data: { username: string; password: string; isAdmin?: boolean }) =>
      fetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      }).then(handleResponse),

    updateUser: (id: string, data: { username?: string; password?: string; isAdmin?: boolean }) =>
      fetch(`${API_BASE}/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      }).then(handleResponse),

    deleteUser: (id: string) =>
      fetch(`${API_BASE}/admin/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      }).then(handleResponse),
  },
};
