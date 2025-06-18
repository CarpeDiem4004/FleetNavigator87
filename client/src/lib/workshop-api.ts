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
  deliveryPersonName?: string;
  deliveryPersonCpf?: string;
  deliveryPersonPhone?: string;
  deliveredDate?: string;
}

class WorkshopAPI {
  private baseURL = '/api/oficina';

  private getToken(): string | null {
    return localStorage.getItem('workshop_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken(); // Always get fresh token
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
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

    localStorage.setItem('workshop_token', response.token);
    
    return response;
  }

  async logout() {
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

  async deliverOrder(orderId: number, deliveryData: {
    deliveryPersonName: string;
    deliveryPersonCpf: string;
    deliveryPersonPhone: string;
    status?: string;
  }) {
    return this.request(`/orders/${orderId}/deliver`, {
      method: 'POST',
      body: JSON.stringify(deliveryData),
    });
  }

  async createCarReception(data: any) {
    return this.request('/car-receptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCarReceptions() {
    return this.request('/car-receptions');
  }

  async updateCarReception(id: number, data: any) {
    return this.request(`/car-receptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const workshopAPI = new WorkshopAPI();