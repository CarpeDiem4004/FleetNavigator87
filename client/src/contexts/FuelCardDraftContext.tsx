import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface DraftFuelCardRequest {
  id: string;
  placa: string;
  km: number;
  valor_solicitado: number;
  valor_litro?: number | null;
  litros_solicitados?: number | null;
  tipo_cartao: string;
  provedor_cartao: string;
  numero_cartao?: string;
  tipo_combustivel: string;
  motorista: string;
  solicitante: string;
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
  timestamp: number;
}

interface FuelCardDraftContextType {
  draftRequests: DraftFuelCardRequest[];
  draftCount: number;
  addToDraft: (request: Omit<DraftFuelCardRequest, 'id' | 'timestamp'>) => string;
  removeFromDraft: (id: string) => void;
  updateDraft: (id: string, updates: Partial<DraftFuelCardRequest>) => void;
  clearDraft: () => void;
  getDuplicates: () => string[];
}

const FuelCardDraftContext = createContext<FuelCardDraftContextType | undefined>(undefined);

const STORAGE_KEY = 'fuel_card_draft_requests';

export function FuelCardDraftProvider({ children }: { children: ReactNode }) {
  // Inicializar diretamente do localStorage para evitar condição de corrida
  const [draftRequests, setDraftRequests] = useState<DraftFuelCardRequest[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('[BOLSÃO] Carregado do localStorage:', parsed.length, 'itens');
        return parsed;
      }
    } catch (error) {
      console.error('[BOLSÃO] Erro ao carregar:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
    return [];
  });
  
  const [isInitialized, setIsInitialized] = useState(false);

  // Marcar como inicializado após primeira renderização
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Salvar no localStorage sempre que mudar (apenas após inicialização)
  useEffect(() => {
    if (!isInitialized) return;
    
    console.log('[BOLSÃO] Salvando no localStorage:', draftRequests.length, 'itens');
    if (draftRequests.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draftRequests));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [draftRequests, isInitialized]);

  // Sincronizar entre abas/componentes usando eventos de storage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            setDraftRequests(parsed);
          } catch (error) {
            console.error('Erro ao sincronizar bolsão:', error);
          }
        } else {
          setDraftRequests([]);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
      // Só verificar duplicatas se todos os campos chave estão presentes
      if (!req.placa || !req.data_uso || !req.valor_solicitado) return;
      
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

  return (
    <FuelCardDraftContext.Provider
      value={{
        draftRequests,
        draftCount: draftRequests.length,
        addToDraft,
        removeFromDraft,
        updateDraft,
        clearDraft,
        getDuplicates,
      }}
    >
      {children}
    </FuelCardDraftContext.Provider>
  );
}

export function useFuelCardDraft() {
  const context = useContext(FuelCardDraftContext);
  if (!context) {
    throw new Error('useFuelCardDraft must be used within FuelCardDraftProvider');
  }
  return context;
}
