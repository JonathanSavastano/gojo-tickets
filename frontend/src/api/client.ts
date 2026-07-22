const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

// Auth
export async function loginUser(email: string, password: string) {
  const form = new URLSearchParams();
  form.append('username', email);
  form.append('password', password);

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(error.detail || 'Login failed');
  }

  return res.json() as Promise<{ access_token: string; token_type: string }>;
}

export async function registerUser(data: {
  email: string;
  password: string;
  display_name: string;
  role?: import('../types').UserRole;
}) {
  return request<import('../types').User>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMe() {
  return request<import('../types').User>('/users/me');
}

export async function getUsers() {
  return request<import('../types').User[]>('/users');
}

export async function deleteUser(id: string) {
  return request<undefined>(`/users/${id}`, { method: 'DELETE' });
}

export async function updateUserRole(id: string, role: import('../types').UserRole) {
  return request<import('../types').User>(`/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

// Projects
export async function getProjects() {
  return request<import('../types').Project[]>('/projects');
}

export async function getProject(id: string) {
  return request<import('../types').Project>(`/projects/${id}`);
}

export async function createProject(data: import('../types').ProjectCreate) {
  return request<import('../types').Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProject(
  id: string,
  data: { name?: string; owner_id?: string }
) {
  return request<import('../types').Project>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteProject(id: string) {
  return request<undefined>(`/projects/${id}`, { method: 'DELETE' });
}

// Project Members
export async function getProjectMembers(projectId: string) {
  return request<import('../types').ProjectMember[]>(
    `/projects/${projectId}/members`
  );
}

export async function addProjectMember(projectId: string, userId: string) {
  return request<unknown>(`/projects/${projectId}/members`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });
}

export async function removeProjectMember(projectId: string, userId: string) {
  return request<undefined>(
    `/projects/${projectId}/members/${userId}`,
    { method: 'DELETE' }
  );
}

// Tickets
export async function getTickets() {
  return request<import('../types').Ticket[]>('/tickets');
}

export async function getTicket(id: string) {
  return request<import('../types').Ticket>(`/tickets/${id}`);
}

export async function createTicket(data: import('../types').TicketCreate) {
  return request<import('../types').Ticket>('/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTicket(
  id: string,
  data: import('../types').TicketUpdate
) {
  return request<import('../types').Ticket>(`/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteTicket(id: string) {
  return request<undefined>(`/tickets/${id}`, { method: 'DELETE' });
}

// Organizations
export async function getMyOrganization() {
  return request<import('../types').Organization>('/organizations/me');
}

export async function createOrganization(data: { name: string; key: string }) {
  return request<import('../types').Organization>('/organizations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function joinOrganization(inviteCode: string) {
  return request<import('../types').Organization>('/organizations/join', {
    method: 'POST',
    body: JSON.stringify({ invite_code: inviteCode }),
  });
}

export async function leaveOrganization() {
  return request<undefined>('/organizations/leave', { method: 'DELETE' });
}
