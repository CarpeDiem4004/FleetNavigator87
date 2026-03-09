// Murici SaaS External Links - Main SPA Application
class MuriciSaaS {
  constructor() {
    this.apiBase = window.location.hostname.includes('localhost') 
      ? 'http://localhost:3001/api' 
      : `${window.location.protocol}//${window.location.hostname}:3001/api`;
    
    this.token = localStorage.getItem('murici_saas_token');
    this.user = JSON.parse(localStorage.getItem('murici_saas_user') || 'null');
    this.currentBase = null;
    
    this.init();
  }

  async init() {
    // Initialize PWA
    this.initPWA();
    
    // Setup routing
    this.setupRouting();
    
    // Check authentication
    if (this.token) {
      await this.verifyAuth();
    }
    
    // Render initial view
    this.render();
  }

  // PWA Initialization
  initPWA() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('Service Worker registered'))
        .catch(err => console.log('Service Worker registration failed'));
    }
  }

  // Simple client-side routing
  setupRouting() {
    window.addEventListener('popstate', () => this.render());
    
    // Handle navigation clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-route]')) {
        e.preventDefault();
        const route = e.target.getAttribute('data-route');
        this.navigate(route);
      }
    });
  }

  navigate(route) {
    history.pushState({}, '', route);
    this.render();
  }

  // Authentication methods
  async login(email, password) {
    try {
      const response = await fetch(`${this.apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (response.ok) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('murici_saas_token', this.token);
        localStorage.setItem('murici_saas_user', JSON.stringify(this.user));
        
        // Redirect to base after login
        this.navigate(`/bases/${this.user.baseId}/external`);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Connection error' };
    }
  }

  async verifyAuth() {
    try {
      const response = await this.apiCall('/auth/verify');
      if (!response.valid) {
        this.logout();
        return false;
      }
      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('murici_saas_token');
    localStorage.removeItem('murici_saas_user');
    this.navigate('/login');
  }

  // API helper with JWT
  async apiCall(endpoint, options = {}) {
    const response = await fetch(`${this.apiBase}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.token ? `Bearer ${this.token}` : '',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // Render current view
  render() {
    const path = window.location.pathname;
    const app = document.getElementById('app');
    
    if (!this.user && path !== '/login') {
      this.renderLogin();
    } else if (path === '/login') {
      this.renderLogin();
    } else if (path.startsWith('/bases/')) {
      this.renderBaseExternal();
    } else {
      this.renderDashboard();
    }
  }

  // Login page
  renderLogin() {
    document.getElementById('app').innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div class="text-center mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Murici SaaS</h1>
            <p class="text-gray-600">External Base Access</p>
          </div>
          
          <form id="loginForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" id="email" required 
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" id="password" required 
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            
            <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
              Login
            </button>
          </form>
          
          <div id="loginMessage" class="mt-4 text-center hidden"></div>
        </div>
      </div>
    `;

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const messageEl = document.getElementById('loginMessage');
      
      messageEl.className = 'mt-4 text-center';
      messageEl.textContent = 'Logging in...';
      
      const result = await this.login(email, password);
      
      if (result.success) {
        messageEl.className = 'mt-4 text-center text-green-600';
        messageEl.textContent = 'Login successful! Redirecting...';
      } else {
        messageEl.className = 'mt-4 text-center text-red-600';
        messageEl.textContent = result.error || 'Login failed';
      }
    });
  }

  // Base external page
  async renderBaseExternal() {
    if (!this.user) {
      this.navigate('/login');
      return;
    }

    const baseId = window.location.pathname.split('/')[2];
    
    try {
      const baseInfo = await this.apiCall(`/bases/${baseId}`);
      this.currentBase = baseInfo;
      
      document.getElementById('app').innerHTML = `
        <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div class="container mx-auto px-4 py-8">
            <!-- Header -->
            <div class="flex justify-between items-center mb-8">
              <div class="text-center flex-1">
                <h1 class="text-4xl font-bold text-gray-900 mb-2">
                  ${baseInfo.name}
                </h1>
                <p class="text-lg text-gray-600">
                  Sistema SaaS - Acesso Externo
                </p>
                <span class="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full mt-2">
                  ${baseInfo.cidade}, ${baseInfo.estado}
                </span>
              </div>
              <div class="flex gap-2">
                <button onclick="app.logout()" 
                        class="flex items-center gap-2 text-red-600 hover:text-red-700 px-4 py-2 border border-red-300 rounded-md hover:bg-red-50 transition-colors">
                  ↪ Sair
                </button>
              </div>
            </div>

            <!-- Service Cards -->
            <div class="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
              
              <!-- Fuel Cards -->
              <div class="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div class="bg-green-50 border-b border-green-200 p-4">
                  <h3 class="flex items-center text-green-700 font-semibold">
                    💳 Cartão Combustível
                  </h3>
                  <p class="text-sm text-green-600">Solicitação de recarga</p>
                </div>
                <div class="p-4">
                  <p class="text-sm text-gray-600 mb-4">
                    Sistema completo para solicitação e acompanhamento de recargas de cartão combustível.
                  </p>
                  <button data-route="/bases/${baseId}/fuel-cards" 
                          class="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors">
                    Acessar Sistema
                  </button>
                </div>
              </div>

              <!-- Maintenance -->
              <div class="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div class="bg-blue-50 border-b border-blue-200 p-4">
                  <h3 class="flex items-center text-blue-700 font-semibold">
                    🔧 Manutenção
                  </h3>
                  <p class="text-sm text-blue-600">Solicitações de serviço</p>
                </div>
                <div class="p-4">
                  <p class="text-sm text-gray-600 mb-4">
                    Agende e acompanhe solicitações de manutenção da frota.
                  </p>
                  <button data-route="/bases/${baseId}/maintenance" 
                          class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors">
                    Fazer Solicitação
                  </button>
                </div>
              </div>

              <!-- Incidents -->
              <div class="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div class="bg-red-50 border-b border-red-200 p-4">
                  <h3 class="flex items-center text-red-700 font-semibold">
                    ⚠️ Sinistros
                  </h3>
                  <p class="text-sm text-red-600">Registro de ocorrências</p>
                </div>
                <div class="p-4">
                  <p class="text-sm text-gray-600 mb-4">
                    Registre sinistros, roubos e outras ocorrências.
                  </p>
                  <button data-route="/bases/${baseId}/incidents" 
                          class="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors">
                    Comunicar Sinistro
                  </button>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="text-center mt-12 text-sm text-gray-500">
              <p>${baseInfo.name} • ${baseInfo.basename}</p>
              <p>Murici SaaS External Links • v1.0</p>
            </div>
          </div>
        </div>
      `;
      
    } catch (error) {
      console.error('Error loading base:', error);
      this.navigate('/login');
    }
  }

  // Dashboard (default view)
  renderDashboard() {
    if (!this.user) {
      this.navigate('/login');
      return;
    }

    document.getElementById('app').innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div class="container mx-auto px-4 py-8">
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold text-gray-900 mb-2">
              Bem-vindo, ${this.user.name}
            </h1>
            <p class="text-lg text-gray-600">Murici SaaS - Sistema Externo</p>
          </div>
          
          <div class="max-w-md mx-auto">
            <div class="bg-white rounded-lg shadow-lg p-6">
              <h3 class="text-lg font-semibold mb-4">Sua Base</h3>
              <button data-route="/bases/${this.user.baseId}/external" 
                      class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md transition-colors">
                Acessar Base ${this.user.basename}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Initialize SaaS application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new MuriciSaaS();
});