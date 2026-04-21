import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

export const goalsAPI = {
  getAll: (params) => api.get('/goals', { params }),
  getOne: (id) => api.get(`/goals/${id}`),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
  getMilestones: (goalId) => api.get(`/goals/${goalId}/milestones`),
  createMilestone: (goalId, data) => api.post(`/goals/${goalId}/milestones`, data),
  updateMilestone: (goalId, milestoneId, data) => api.put(`/goals/${goalId}/milestones/${milestoneId}`, data),
  getProgress: (goalId) => api.get(`/goals/${goalId}/progress`),
  logProgress: (goalId, data) => api.post(`/goals/${goalId}/progress`, data)
};

export const habitsAPI = {
  getAll: () => api.get('/habits'),
  getOne: (id) => api.get(`/habits/${id}`),
  create: (data) => api.post('/habits', data),
  update: (id, data) => api.put(`/habits/${id}`, data),
  delete: (id) => api.delete(`/habits/${id}`),
  complete: (id, data) => api.post(`/habits/${id}/complete`, data),
  uncomplete: (id) => api.post(`/habits/${id}/uncomplete`),
  getHistory: (id) => api.get(`/habits/${id}/history`)
};

export const budgetsAPI = {
  getAll: () => api.get('/budgets'),
  getOne: (id) => api.get(`/budgets/${id}`),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
  getCategories: (budgetId) => api.get(`/budgets/${budgetId}/categories`),
  createCategory: (budgetId, data) => api.post(`/budgets/${budgetId}/categories`, data),
  updateCategory: (budgetId, categoryId, data) => api.put(`/budgets/${budgetId}/categories/${categoryId}`, data),
  deleteCategory: (budgetId, categoryId) => api.delete(`/budgets/${budgetId}/categories/${categoryId}`),
  getExpenses: (budgetId) => api.get(`/budgets/${budgetId}/expenses`),
  createExpense: (budgetId, data) => api.post(`/budgets/${budgetId}/expenses`, data),
  deleteExpense: (budgetId, expenseId) => api.delete(`/budgets/${budgetId}/expenses/${expenseId}`),
  getSummary: (budgetId) => api.get(`/budgets/${budgetId}/summary`)
};

export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard')
};

export default api;
