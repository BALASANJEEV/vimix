import axios, { AxiosError, AxiosResponse } from 'axios';

// ✅ Create Axios instance with credentials enabled
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ----- Global response interceptor for error handling -----
API.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received from server:', error.request);
    } else {
      console.error('Axios setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Attach auth token (admin or partner) if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any)['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ----- Admins / Auth -----
export const login = (data: any) => API.post('/api/admin/login', data);
export const signup = (data: any) => API.post('/api/admin/signup', data);

// ----- Partners (admin-managed) -----
export const getPartners = () => API.get('/api/admin/partners');
export const getPartnerById = (id: string) => API.get(`/api/admin/partners/${id}`);
export const createPartner = (data: any) => API.post('/api/admin/partners', data);
export const updatePartner = (id: string, data: any) => API.put(`/api/admin/partners/${id}`, data);
export const deletePartner = (id: string) => API.delete(`/api/admin/partners/${id}`);

// ----- Partner auth (for partner login) -----
// export const loginPartner = (data: any) => API.post('/partners/login', data);
// export const registerPartner = (data: any) => API.post('/partners/register', data);

// ----- Clients -----
export const getClients = () => API.get('/api/clients');
export const getClientById = (id: string) => API.get(`/api/clients/${id}`);
export const getClientDetails = (id: string) => API.get(`/api/clients/${id}/details`);
export const createClient = (data: any) => API.post('/api/clients', data);
export const updateClient = (id: string, data: any) => API.put(`/api/clients/${id}`, data);
export const deleteClient = (id: string) => API.delete(`/api/clients/${id}`);

// ----- Projects -----
export const getProjects = () => API.get('/api/projects');
export const getProjectById = (id: string) => API.get(`/api/projects/${id}`);
export const getProjectDetails = (id: string) => API.get(`/api/projects/${id}/details`);
export const createProject = (data: any) => API.post('/api/projects', data);
export const updateProject = (id: string, data: any) => API.put(`/api/projects/${id}`, data);
export const deleteProject = (id: string) => API.delete(`/api/projects/${id}`);
export const updateProjectStage = (id: string, stage: string) => API.put(`/api/projects/${id}/stage`, { stage });

// ----- Project Files & Meetings -----
export const uploadProjectDocument = (id: string, docType: string, file: File) => {
  const form = new FormData();
  form.append('file', file);
  form.append('docType', docType);
  return API.post(`/api/projects/${id}/documents`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteProjectDocument = (id: string, docType: string) => API.delete(`/api/projects/${id}/documents/${docType}`);

export const addProjectMeeting = (id: string, payload: { date: string; time: string; title: string; notes?: string }) =>
  API.post(`/api/projects/${id}/meetings`, payload);

// Partner-specific SRS upload
export const uploadSrs = (id: string, file: File) => {
  const form = new FormData();
  form.append('file', file);
  return API.post(`/api/partners/projects/${id}/srs`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// ----- Payments -----
export const getPayments = () => API.get('/api/payments');
export const getPaymentById = (id: string) => API.get(`/api/payments/${id}`);
export const getPaymentDetails = (id: string) => API.get(`/api/payments/${id}/details`);
export const createPayment = (data: any) => API.post('/api/payments', data);
export const updatePayment = (id: string, data: any) => API.put(`/api/payments/${id}`, data);
export const deletePayment = (id: string) => API.delete(`/api/payments/${id}`);

export default API;
