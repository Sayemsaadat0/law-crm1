import type { User } from '@/types/user.types';

// API Configuration and utilities

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  user?: T;
  token?: string;
  token_type?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getAuthToken();
    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      let data: ApiResponse<T>;

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          throw new Error('Invalid JSON response from server');
        }
      } else {
        const text = await response.text();
        throw new Error(text || 'An error occurred');
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // FormData request for file uploads (PUT method)
  async putFormData<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const token = this.getAuthToken();
    
    // Use POST endpoint for FormData uploads (better compatibility)
    const uploadEndpoint = endpoint === '/user' ? '/user/update' : endpoint;
    const url = `${this.baseURL}${uploadEndpoint}`;

    // Don't set Content-Type - let browser set it with boundary for FormData
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      // Use POST method for FormData (most reliable)
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      let data: ApiResponse<T>;

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          throw new Error('Invalid JSON response from server');
        }
      } else {
        const text = await response.text();
        throw new Error(text || 'An error occurred');
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // FormData request for file uploads
  async postFormData<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const token = this.getAuthToken();
    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      let data: ApiResponse<T>;

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          throw new Error('Invalid JSON response from server');
        }
      } else {
        const text = await response.text();
        throw new Error(text || 'An error occurred');
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }
}

export const api = new ApiClient(API_BASE_URL);

// Auth API endpoints
export const authApi = {
  login: (email: string, password: string) =>
    api.post<User>('/login', { email, password }),

  register: (data: any) =>
    api.post<User>('/register', data),

  logout: () => api.post('/logout'),

  getUser: () => api.get<User>('/user'),

  updateUser: (data: any) => api.put<User>('/user', data),

  changePassword: (current_password: string, password: string, password_confirmation: string) =>
    api.post('/change-password', { current_password, password, password_confirmation }),
};

// Courts API endpoints
export interface Court {
  id: number;
  name: string;
  address: string;
  status: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CourtsResponse {
  data: {
    data: Court[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const courtsApi = {
  getAll: (params?: { search?: string; status?: boolean; per_page?: number; page?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status !== undefined) queryParams.append('status', params.status.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const queryString = queryParams.toString();
    return api.get<CourtsResponse['data']>(`/courts${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id: number) => api.get<{ data: Court }>(`/courts/${id}`),

  create: (data: { name: string; address: string; status?: boolean }) =>
    api.post<{ data: Court }>('/courts', data),

  update: (id: number, data: { name?: string; address?: string; status?: boolean }) =>
    api.put<{ data: Court }>(`/courts/${id}`, data),

  delete: (id: number) => api.delete(`/courts/${id}`),

  bulkStore: (courts: Array<{ name: string; address: string; status?: boolean }>) =>
    api.post<{ data: Court[] }>('/courts/bulk', { courts }),
};

// Users/Members API endpoints
export interface UserListItem {
  id: number;
  name: string;
  email: string;
  mobile?: string;
  role: 'admin' | 'owner' | 'lawyer';
  image?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UsersResponse {
  data: {
    data: UserListItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const usersApi = {
  getAll: (
    params?: {
      search?: string;
      per_page?: number;
      page?: number;
      role?: 'admin' | 'owner' | 'lawyer';
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.role) queryParams.append('role', params.role);
    
    const queryString = queryParams.toString();
    return api.get<UsersResponse['data']>(`/users${queryString ? `?${queryString}` : ''}`);
  },

  create: (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation?: string;
    mobile?: string;
    role?: 'admin' | 'owner' | 'lawyer';
  }) =>
    api.post<{ user: UserListItem; token: string }>('/register', data),

  delete: (id: number) => api.delete(`/users/${id}`),
};

// Cases API endpoints
export interface CaseListItem {
  id: number;
  number_of_case: string;
  file_number?: string;
  stages: string; // 'active' | 'disposed' | 'archive' | 'left'
  description?: string;
  date?: string;
  // New meta fields for case sides
  appellant_name?: string;
  appellant_relation?: string;
  respondent_name?: string;
  respondent_relation?: string;
  lawyer_id: number;
  court_id: number;
  lawyer?: {
    id: number;
    name: string;
    email: string;
    mobile?: string;
    image?: string;
  };
  court?: {
    id: number;
    name: string;
    address: string;
  };
  caseClients?: Array<{
    id: number;
    client_name: string;
    client_email?: string;
    client_phone?: string;
    client_address?: string;
    account_number?: string;
    account_name?: string;
    account_id?: string;
  }>;
  caseParties?: Array<{
    id: number;
    party_name: string;
    party_email?: string;
    party_phone?: string;
    party_address?: string;
  }>;
  caseHearings?: Array<{
    id: number;
    title: string;
    serial_number: string;
    date: string;
    note?: string;
    file?: string;
  }>;
  casePayments?: Array<{
    id: number;
    amount: number;
    date: string;
    case_hearing_id?: number;
  }>;
  created_at?: string;
  updated_at?: string;
}

export interface CasesResponse {
  data: {
    data: CaseListItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const casesApi = {
  getAll: (params?: {
    search?: string;
    status?: string;
    lawyer_id?: number;
    court_id?: number;
    date_from?: string;
    date_to?: string;
    with_clients?: boolean;
    with_parties?: boolean;
    with_hearings?: boolean;
    with_payments?: boolean;
    per_page?: number;
    page?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.lawyer_id) queryParams.append('lawyer_id', params.lawyer_id.toString());
    if (params?.court_id) queryParams.append('court_id', params.court_id.toString());
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.with_clients) queryParams.append('with_clients', '1');
    if (params?.with_parties) queryParams.append('with_parties', '1');
    if (params?.with_hearings) queryParams.append('with_hearings', '1');
    if (params?.with_payments) queryParams.append('with_payments', '1');
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const queryString = queryParams.toString();
    return api.get<CasesResponse['data']>(`/cases/all/with-all-details${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id: number) => api.get<{ data: CaseListItem }>(`/cases/${id}/with-all-details`),

  create: (data: any) => api.post<{ data: CaseListItem }>('/cases', data),

  update: (id: number, data: any) => api.put<{ data: CaseListItem }>(`/cases/${id}`, data),

  delete: (id: number) => api.delete(`/cases/${id}`),
};

// Case Clients API endpoints
export interface CaseClient {
  id: number;
  client_name: string;
  client_phone?: string | null;
  client_address?: string | null;
  billing_bank_name?: string | null;
  referring_firm?: string | null;
  client_reference_number?: string | null;
  client_description?: string | null;
   fee_schedule?: string | null;
  case_id: number;
}

export const caseClientsApi = {
  create: (formData: FormData) =>
    api.postFormData<{ data: CaseClient }>('/case-clients', formData),

  update: (id: number, data: Omit<CaseClient, 'id'>) =>
    api.put<{ data: CaseClient }>(`/case-clients/${id}`, data),
};

// Case Parties API endpoints
export interface CaseParty {
  id: number;
  party_name: string;
  party_email?: string | null;
  party_phone?: string | null;
  party_address?: string | null;
  reference?: string | null;
  party_description?: string | null;
  case_id: number;
}

export const casePartiesApi = {
  create: (data: Omit<CaseParty, 'id'>) =>
    api.post<{ data: CaseParty }>('/case-parties', data),

  update: (id: number, data: Omit<CaseParty, 'id'>) =>
    api.put<{ data: CaseParty }>(`/case-parties/${id}`, data),
};

// Case Hearings API endpoints
export interface CaseHearing {
  id: number;
  title: string;
  serial_number?: string;
  date: string;
  note?: string;
  file?: string;
  case_id: number;
}

export const caseHearingsApi = {
  // Uses multipart/form-data because of optional file upload
  create: (formData: FormData) =>
    api.postFormData<{ data: CaseHearing }>('/case-hearings', formData),
};

// Case Payments API endpoints
export interface CasePayment {
  id: number;
  date: string;
  amount: number;
  case_id: number;
  case_hearing_id?: number;
}

export const casePaymentsApi = {
  create: (data: {
    date: string;
    amount: number;
    case_id: number;
    case_hearing_id?: number;
  }) => api.post<{ data: CasePayment }>('/case-payments', data),
};

// Dashboard API endpoints
export interface DashboardStats {
  users: number;
  courts: number;
  cases: {
    total: number;
    active: number;
    disposed: number;
    resolve: number;
    archive: number;
  };
  case_clients: number;
  case_parties: number;
  case_hearings: number;
  case_payments: number;
  total_payments_amount: string;
}

export const dashboardApi = {
  getStats: () => api.get<{ data: DashboardStats }>('/dashboard/stats'),
};
