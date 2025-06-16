/**
 * API functions for the external workshop system
 */

export interface WorkshopAuth {
  token: string;
  oficina: {
    id: number;
    razao_social: string;
    cnpj: string;
    email: string;
    telefone: string;
  };
}

export interface ServiceOrder {
  id: number;
  vehiclePlate: string;
  description: string;
  status: string;
  priority: string;
  entryDate: string;
  estimatedCompletion?: string;
  initialBudget?: string;
  finalCost?: string;
  maintenanceType: string;
}

class WorkshopAPI {
  private baseURL = '/api/oficina';
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('workshop_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(error.message || 'Erro na requisição');
    }

    return response.json();
  }

  async login(cnpj: string, password: string): Promise<WorkshopAuth> {
    const response = await this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ cnpj, password }),
    });

    this.token = response.token;
    localStorage.setItem('workshop_token', this.token!);
    
    return response;
  }

  async logout() {
    this.token = null;
    localStorage.removeItem('workshop_token');
  }

  async getProfile() {
    return this.request('/profile');
  }

  async getOrders(): Promise<ServiceOrder[]> {
    return this.request('/orders');
  }

  async updateOrderStatus(orderId: number, status: string) {
    return this.request(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const workshopAPI = new WorkshopAPI();