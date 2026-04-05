const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Helpers ────────────────────────────────────────────────────────────────

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) {
    if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      throw new Error(data.errors[0].msg || 'Validation failed');
    }
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

// ─── Auth ────────────────────────────────────────────────────────────────────

export const loginUser = async (email, password) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleResponse(res);
  if (data.token) localStorage.setItem('token', data.token);
  if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
  return data;
};

export const registerUser = async (payload) => {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse(res);
  if (data.token) localStorage.setItem('token', data.token);
  if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
  return data;
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isAuthenticated = () => !!localStorage.getItem('token');

// ─── User ────────────────────────────────────────────────────────────────────

export const getProfile = async () => {
  const res = await fetch(`${BASE_URL}/user/profile`, { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const updateProfile = async (payload) => {
  const res = await fetch(`${BASE_URL}/user/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const fetchDashboardData = async () => {
  const res = await fetch(`${BASE_URL}/dashboard`, { headers: getAuthHeaders() });
  const data = await handleResponse(res);
  return data.data; // unwrap the `data` key
};

export const askAIChat = async (payload) => {
  const res = await fetch(`${BASE_URL}/dashboard/chat`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

// ─── Transactions ─────────────────────────────────────────────────────────────

export const getTransactions = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/transactions?${query}`, { headers: getAuthHeaders() });
  return handleResponse(res);
};

export const addTransaction = async (payload) => {
  const res = await fetch(`${BASE_URL}/transactions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

export const deleteTransaction = async (id) => {
  const res = await fetch(`${BASE_URL}/transactions/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const uploadCSV = async (file) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/transactions/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }, // No Content-Type — browser sets multipart boundary automatically
    body: formData,
  });
  return handleResponse(res);
};

export const loadSampleData = async () => {
  const res = await fetch(`${BASE_URL}/transactions/sample`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ─── Mock fallback (for dev without backend) ──────────────────────────────────

export const mockLogin = async (email) => {
  return { token: 'mock_token', user: { name: 'Demo User', email } };
};
