import { useState, useEffect } from 'react';

export interface DraftFuelCardRequest {
  id: string;
  placa: string;
  km: number;
  valor_solicitado: number;
  tipo_cartao: string;
  provedor_cartao: string;
  numero_cartao?: string;
  tipo_combustivel: string;
  motorista: string; // Nome do motorista
  solicitante: string; // Nome do solicitante
  telefone_celular?: string;
  base: string;
  id_rota: string;
  observacoes?: string;
  projeto_id: number;
  base_id: number;
  data_uso?: string;
  turno?: string;
  projeto_nome?: string;
  base_nome?: string;
  timestamp: number; // Para ordenação
}

const STORAGE_KEY = 'fuel_card_draft_requests';

export function useFuelCardDraft() {
  const [draftRequests, setDraftRequests] = useState<DraftFuelCardRequest[]>([]);

  // Carregar do localStorage na inicialização
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDraftRequests(parsed);
      } catch (error) {
        console.error('Erro ao carregar bolsão:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Salvar no localStorage sempre que mudar
  useEffect(() => {
    if (draftRequests.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draftRequests));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [draftRequests]);

  const addToDraft = (request: Omit<DraftFuelCardRequest, 'id' | 'timestamp'>) => {
    const newRequest: DraftFuelCardRequest = {
      ...request,
      id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    setDraftRequests(prev => [...prev, newRequest]);
    return newRequest.id;
  };

  const removeFromDraft = (id: string) => {
    setDraftRequests(prev => prev.filter(req => req.id !== id));
  };

  const updateDraft = (id: string, updates: Partial<DraftFuelCardRequest>) => {
    setDraftRequests(prev => 
      prev.map(req => req.id === id ? { ...req, ...updates } : req)
    );
  };

  const clearDraft = () => {
    setDraftRequests([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const getDuplicates = () => {
    const duplicates: string[] = [];
    const seen = new Map<string, string>();

    draftRequests.forEach(req => {
      const key = `${req.placa}_${req.data_uso}_${req.valor_solicitado}`;
      if (seen.has(key)) {
        duplicates.push(req.id);
        duplicates.push(seen.get(key)!);
      } else {
        seen.set(key, req.id);
      }
    });

    return [...new Set(duplicates)];
  };

  return {
    draftRequests,
    draftCount: draftRequests.length,
    addToDraft,
    removeFromDraft,
    updateDraft,
    clearDraft,
    getDuplicates,
  };
}
