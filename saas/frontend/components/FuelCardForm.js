// Fuel Card Request Form Component
class FuelCardForm {
  constructor(container, baseId, onSuccess) {
    this.container = container;
    this.baseId = baseId;
    this.onSuccess = onSuccess;
    this.isSubmitting = false;
    
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
        <div class="bg-green-50 border-b border-green-200 px-6 py-4">
          <h2 class="text-xl font-semibold text-green-800">
            💳 Solicitação de Cartão Combustível
          </h2>
          <p class="text-sm text-green-600 mt-1">
            Preencha os dados para solicitar recarga do cartão
          </p>
        </div>
        
        <form id="fuelCardForm" class="p-6 space-y-6">
          <!-- Card Number -->
          <div>
            <label for="numero_cartao" class="block text-sm font-medium text-gray-700 mb-2">
              Número do Cartão *
            </label>
            <input 
              type="text" 
              id="numero_cartao" 
              name="numero_cartao"
              required 
              maxlength="20"
              placeholder="Ex: 1234567890123456"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <p class="text-xs text-gray-500 mt-1">Digite o número completo do cartão</p>
          </div>

          <!-- Provider -->
          <div>
            <label for="provedor_cartao" class="block text-sm font-medium text-gray-700 mb-2">
              Provedor do Cartão *
            </label>
            <select 
              id="provedor_cartao" 
              name="provedor_cartao"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Selecione o provedor</option>
              <option value="Shell">Shell</option>
              <option value="Petrobras">Petrobras</option>
              <option value="Ipiranga">Ipiranga</option>
              <option value="Raizen">Raizen</option>
              <option value="Ale">Ale</option>
              <option value="Ticket Car">Ticket Car</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <!-- Amount -->
          <div>
            <label for="valor_solicitado" class="block text-sm font-medium text-gray-700 mb-2">
              Valor Solicitado (R$)
            </label>
            <input 
              type="number" 
              id="valor_solicitado" 
              name="valor_solicitado"
              step="0.01"
              min="0"
              placeholder="0.00"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <p class="text-xs text-gray-500 mt-1">Valor em reais (opcional)</p>
          </div>

          <!-- Request Type -->
          <div>
            <label for="tipo_solicitacao" class="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Solicitação
            </label>
            <select 
              id="tipo_solicitacao" 
              name="tipo_solicitacao"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="recarga">Recarga</option>
              <option value="desbloqueio">Desbloqueio</option>
              <option value="cancelamento">Cancelamento</option>
              <option value="segunda_via">Segunda Via</option>
            </select>
          </div>

          <!-- Observations -->
          <div>
            <label for="observacoes" class="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea 
              id="observacoes" 
              name="observacoes"
              rows="4"
              maxlength="500"
              placeholder="Informações adicionais sobre a solicitação..."
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
            ></textarea>
            <p class="text-xs text-gray-500 mt-1">Máximo 500 caracteres</p>
          </div>

          <!-- Submit Button -->
          <div class="flex gap-4 pt-4">
            <button 
              type="submit"
              id="submitBtn"
              class="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <span class="submit-text">Enviar Solicitação</span>
              <div class="loading hidden ml-2">
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            </button>
            
            <button 
              type="button"
              id="cancelBtn"
              class="bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>

          <!-- Status Message -->
          <div id="statusMessage" class="hidden p-4 rounded-lg"></div>
        </form>
      </div>
    `;
  }

  bindEvents() {
    const form = this.container.querySelector('#fuelCardForm');
    const submitBtn = this.container.querySelector('#submitBtn');
    const cancelBtn = this.container.querySelector('#cancelBtn');
    const statusMessage = this.container.querySelector('#statusMessage');
    
    // Format card number input
    const cardInput = this.container.querySelector('#numero_cartao');
    cardInput.addEventListener('input', (e) => {
      // Remove non-digits
      let value = e.target.value.replace(/\D/g, '');
      // Limit to 20 digits
      value = value.substring(0, 20);
      e.target.value = value;
    });

    // Format currency input
    const valorInput = this.container.querySelector('#valor_solicitado');
    valorInput.addEventListener('blur', (e) => {
      if (e.target.value) {
        e.target.value = parseFloat(e.target.value).toFixed(2);
      }
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit(form, statusMessage);
    });

    // Cancel button
    cancelBtn.addEventListener('click', () => {
      if (this.onSuccess) {
        this.onSuccess();
      }
    });
  }

  async handleSubmit(form, statusMessage) {
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    const submitBtn = form.querySelector('#submitBtn');
    const submitText = submitBtn.querySelector('.submit-text');
    const loading = submitBtn.querySelector('.loading');

    // Update UI
    submitBtn.disabled = true;
    submitText.textContent = 'Enviando...';
    loading.classList.remove('hidden');
    statusMessage.classList.add('hidden');

    try {
      // Get form data
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      // Validate required fields
      if (!data.numero_cartao || !data.provedor_cartao) {
        throw new Error('Número do cartão e provedor são obrigatórios');
      }

      // Make API request
      const response = await window.app.apiCall(`/bases/${this.baseId}/fuel-cards`, {
        method: 'POST',
        body: JSON.stringify(data)
      });

      // Success
      statusMessage.className = 'p-4 rounded-lg bg-green-50 border border-green-200';
      statusMessage.innerHTML = `
        <div class="flex items-center">
          <div class="text-green-500 mr-2">✅</div>
          <div>
            <p class="font-medium text-green-800">Solicitação enviada com sucesso!</p>
            <p class="text-sm text-green-600">Número de protocolo: ${response.data.id}</p>
          </div>
        </div>
      `;
      statusMessage.classList.remove('hidden');

      // Reset form
      form.reset();

      // Call success callback after 2 seconds
      setTimeout(() => {
        if (this.onSuccess) {
          this.onSuccess();
        }
      }, 2000);

    } catch (error) {
      console.error('Fuel card submission error:', error);
      
      statusMessage.className = 'p-4 rounded-lg bg-red-50 border border-red-200';
      statusMessage.innerHTML = `
        <div class="flex items-center">
          <div class="text-red-500 mr-2">❌</div>
          <div>
            <p class="font-medium text-red-800">Erro ao enviar solicitação</p>
            <p class="text-sm text-red-600">${error.message || 'Tente novamente mais tarde'}</p>
          </div>
        </div>
      `;
      statusMessage.classList.remove('hidden');

    } finally {
      // Reset button state
      this.isSubmitting = false;
      submitBtn.disabled = false;
      submitText.textContent = 'Enviar Solicitação';
      loading.classList.add('hidden');
    }
  }
}

// Fuel Card List Component
class FuelCardList {
  constructor(container, baseId) {
    this.container = container;
    this.baseId = baseId;
    this.currentPage = 1;
    this.currentFilter = 'all';
    
    this.render();
    this.loadData();
  }

  render() {
    this.container.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg">
        <div class="bg-green-50 border-b border-green-200 px-6 py-4">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-semibold text-green-800">
                📋 Minhas Solicitações
              </h2>
              <p class="text-sm text-green-600 mt-1">
                Acompanhe o status das suas solicitações
              </p>
            </div>
            
            <select id="statusFilter" class="px-3 py-2 border border-green-300 rounded-lg text-sm">
              <option value="all">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="aprovado">Aprovado</option>
              <option value="rejeitado">Rejeitado</option>
            </select>
          </div>
        </div>
        
        <div id="cardsList" class="p-6">
          <div class="text-center py-8">
            <div class="loading mx-auto mb-4"></div>
            <p class="text-gray-600">Carregando solicitações...</p>
          </div>
        </div>
        
        <div id="pagination" class="px-6 py-4 border-t hidden">
          <!-- Pagination will be rendered here -->
        </div>
      </div>
    `;

    // Bind filter event
    this.container.querySelector('#statusFilter').addEventListener('change', (e) => {
      this.currentFilter = e.target.value;
      this.currentPage = 1;
      this.loadData();
    });
  }

  async loadData() {
    const cardsList = this.container.querySelector('#cardsList');
    
    try {
      const params = new URLSearchParams({
        page: this.currentPage,
        limit: 10
      });

      if (this.currentFilter !== 'all') {
        params.append('status', this.currentFilter);
      }

      const response = await window.app.apiCall(`/bases/${this.baseId}/fuel-cards?${params}`);
      
      this.renderCards(response.data);
      this.renderPagination(response.pagination);

    } catch (error) {
      console.error('Error loading fuel cards:', error);
      cardsList.innerHTML = `
        <div class="text-center py-8">
          <div class="text-red-500 text-4xl mb-4">⚠️</div>
          <p class="text-gray-600">Erro ao carregar solicitações</p>
          <button onclick="location.reload()" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">
            Tentar Novamente
          </button>
        </div>
      `;
    }
  }

  renderCards(cards) {
    const cardsList = this.container.querySelector('#cardsList');
    
    if (cards.length === 0) {
      cardsList.innerHTML = `
        <div class="text-center py-8">
          <div class="text-gray-400 text-4xl mb-4">📄</div>
          <p class="text-gray-600">Nenhuma solicitação encontrada</p>
        </div>
      `;
      return;
    }

    cardsList.innerHTML = cards.map(card => `
      <div class="border border-gray-200 rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h3 class="font-medium text-gray-900">
              Cartão ${card.numero_cartao}
            </h3>
            <p class="text-sm text-gray-600">
              ${card.provedor_cartao} • Protocolo: ${card.id}
            </p>
          </div>
          <span class="status-badge ${this.getStatusClass(card.status)}">
            ${this.getStatusText(card.status)}
          </span>
        </div>
        
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500">Valor:</span>
            <span class="font-medium">R$ ${parseFloat(card.valor_solicitado || 0).toFixed(2)}</span>
          </div>
          <div>
            <span class="text-gray-500">Data:</span>
            <span class="font-medium">${new Date(card.created_at).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
        
        ${card.observacoes ? `
          <div class="mt-3 pt-3 border-t border-gray-100">
            <p class="text-sm text-gray-600">
              <strong>Observações:</strong> ${card.observacoes}
            </p>
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  renderPagination(pagination) {
    const paginationEl = this.container.querySelector('#pagination');
    
    if (pagination.pages <= 1) {
      paginationEl.classList.add('hidden');
      return;
    }

    paginationEl.classList.remove('hidden');
    paginationEl.innerHTML = `
      <div class="flex justify-between items-center">
        <p class="text-sm text-gray-600">
          Mostrando ${((pagination.page - 1) * pagination.limit) + 1} - 
          ${Math.min(pagination.page * pagination.limit, pagination.total)} 
          de ${pagination.total} resultados
        </p>
        
        <div class="flex gap-2">
          ${pagination.page > 1 ? `
            <button onclick="this.changePage(${pagination.page - 1})" 
                    class="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              Anterior
            </button>
          ` : ''}
          
          <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
            ${pagination.page} de ${pagination.pages}
          </span>
          
          ${pagination.page < pagination.pages ? `
            <button onclick="this.changePage(${pagination.page + 1})" 
                    class="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              Próxima
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  changePage(page) {
    this.currentPage = page;
    this.loadData();
  }

  getStatusClass(status) {
    const classes = {
      'pendente': 'bg-yellow-100 text-yellow-800',
      'aprovado': 'bg-green-100 text-green-800',
      'rejeitado': 'bg-red-100 text-red-800'
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${classes[status] || 'bg-gray-100 text-gray-800'}`;
  }

  getStatusText(status) {
    const texts = {
      'pendente': 'Pendente',
      'aprovado': 'Aprovado',
      'rejeitado': 'Rejeitado'
    };
    return texts[status] || status;
  }
}

// Export components for global use
if (typeof window !== 'undefined') {
  window.FuelCardForm = FuelCardForm;
  window.FuelCardList = FuelCardList;
}