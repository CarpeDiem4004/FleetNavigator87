import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, withRetry, checkSupabaseConnection } from '@/lib/supabaseClient';

/**
 * Hook personalizado para salvar dados automaticamente e lidar com falhas de conexão
 * 
 * @param {string} table - Nome da tabela do Supabase onde salvar os dados
 * @param {string} cacheKey - Chave única para salvar no localStorage
 * @param {object} initialData - Dados iniciais do formulário
 * @param {object} options - Opções adicionais (validação, transformação, etc.)
 */
export function useAutoSave(table, cacheKey, initialData = {}, options = {}) {
  const [data, setData] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState(null);
  const [offlineCache, setOfflineCache] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const saveTimeoutRef = useRef(null);
  
  const fullCacheKey = `muricionfleet_${cacheKey}`;
  const offlineCacheKey = `muricionfleet_offline_${cacheKey}`;
  
  // Opções padrão
  const {
    debounceTime = 3000,          // Tempo para salvar após a última mudança
    validateBeforeSave = null,    // Função para validar dados antes de salvar
    transformBeforeSave = null,   // Função para transformar dados antes de salvar
    onSaveSuccess = null,         // Callback após salvar com sucesso
    onSaveError = null,           // Callback após erro ao salvar
    saveInBackground = true,      // Se deve salvar em segundo plano
    persistLocally = true         // Se deve persistir localmente
  } = options;
  
  // Carrega dados do cache local quando o componente é montado
  useEffect(() => {
    const loadFromCache = () => {
      if (persistLocally) {
        try {
          // Carregar dados do formulário do cache
          const cachedData = localStorage.getItem(fullCacheKey);
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            setData(prevData => ({ ...prevData, ...parsedData }));
          }
          
          // Carregar dados offline (não sincronizados)
          const offlineData = localStorage.getItem(offlineCacheKey);
          if (offlineData) {
            setOfflineCache(JSON.parse(offlineData));
          }
        } catch (error) {
          console.error('Erro ao carregar dados do cache:', error);
        }
      }
    };
    
    loadFromCache();
    
    // Configurar listeners de status online/offline
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData(); // Sincronizar dados quando voltar online
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Verificar inicialmente o status da conexão com Supabase
    checkSupabaseConnection().then(isConnected => {
      setIsOnline(isConnected);
    });
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      // Limpar qualquer timeout pendente
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [fullCacheKey, offlineCacheKey, persistLocally]);
  
  // Função para sincronizar dados offline quando voltar online
  const syncOfflineData = useCallback(async () => {
    if (offlineCache.length === 0) return;
    
    setSaving(true);
    
    try {
      // Para cada item no cache offline, tentar sincronizar
      const results = await Promise.allSettled(
        offlineCache.map(async (item) => {
          try {
            // Transformar os dados se necessário
            const dataToSave = transformBeforeSave ? transformBeforeSave(item.data) : item.data;
            
            // Tenta salvar com retry
            const { data, error } = await withRetry(() => {
              if (item.method === 'insert') {
                return supabase.from(table).insert(dataToSave);
              } else if (item.method === 'upsert') {
                return supabase.from(table).upsert(dataToSave);
              } else if (item.method === 'update') {
                const { id, ...updateData } = dataToSave;
                return supabase.from(table).update(updateData).eq('id', id);
              }
            });
            
            if (error) throw error;
            return { success: true, data, originalItem: item };
          } catch (err) {
            return { success: false, error: err, originalItem: item };
          }
        })
      );
      
      // Filtrar itens que não puderam ser sincronizados
      const failedItems = results
        .filter(result => result.status === 'rejected' || !result.value.success)
        .map(result => result.status === 'rejected' ? null : result.value.originalItem)
        .filter(Boolean);
      
      // Atualizar o cache offline apenas com os itens que falharam
      setOfflineCache(failedItems);
      localStorage.setItem(offlineCacheKey, JSON.stringify(failedItems));
      
      if (failedItems.length === 0) {
        console.log('Todos os dados offline foram sincronizados com sucesso');
      } else {
        console.warn(`${failedItems.length} itens não puderam ser sincronizados e permanecem no cache offline`);
      }
    } catch (error) {
      console.error('Erro ao sincronizar dados offline:', error);
    } finally {
      setSaving(false);
    }
  }, [offlineCache, table, transformBeforeSave, offlineCacheKey]);
  
  // Salvar dados no Supabase
  const saveToSupabase = useCallback(async (dataToSave, method = 'upsert') => {
    if (validateBeforeSave && !validateBeforeSave(dataToSave)) {
      console.warn('Validação falhou, não salvando dados');
      return { success: false, error: new Error('Validação falhou') };
    }
    
    // Transformar dados se necessário
    const transformedData = transformBeforeSave ? transformBeforeSave(dataToSave) : dataToSave;
    
    // Se estiver offline, guardar no cache e retornar
    if (!isOnline) {
      const offlineItem = {
        id: Date.now(), // ID temporário para o item
        timestamp: new Date().toISOString(),
        method,
        data: transformedData
      };
      
      const newOfflineCache = [...offlineCache, offlineItem];
      setOfflineCache(newOfflineCache);
      localStorage.setItem(offlineCacheKey, JSON.stringify(newOfflineCache));
      
      return {
        success: true,
        offline: true,
        message: 'Salvo offline, será sincronizado quando a conexão for restaurada'
      };
    }
    
    // Tentar salvar no Supabase
    try {
      setSaving(true);
      setError(null);
      
      let result;
      
      // Usar diferentes métodos de inserção baseado no parâmetro method
      if (method === 'insert') {
        result = await withRetry(() => supabase.from(table).insert(transformedData));
      } else if (method === 'upsert') {
        result = await withRetry(() => supabase.from(table).upsert(transformedData));
      } else if (method === 'update') {
        const { id, ...updateData } = transformedData;
        result = await withRetry(() => supabase.from(table).update(updateData).eq('id', id));
      } else {
        throw new Error(`Método desconhecido: ${method}`);
      }
      
      const { error } = result;
      
      if (error) {
        setError(error);
        if (onSaveError) onSaveError(error);
        
        // Mesmo com erro, salvar no cache offline
        const offlineItem = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          method,
          data: transformedData
        };
        
        const newOfflineCache = [...offlineCache, offlineItem];
        setOfflineCache(newOfflineCache);
        localStorage.setItem(offlineCacheKey, JSON.stringify(newOfflineCache));
        
        return { success: false, error, offline: true };
      }
      
      // Atualizar timestamp de último salvamento
      const now = new Date();
      setLastSaved(now);
      
      if (onSaveSuccess) onSaveSuccess(result.data);
      
      return { success: true, data: result.data, timestamp: now };
    } catch (err) {
      console.error('Erro ao salvar dados:', err);
      setError(err);
      
      if (onSaveError) onSaveError(err);
      
      // Salvar no cache offline em caso de erro
      const offlineItem = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        method,
        data: transformedData
      };
      
      const newOfflineCache = [...offlineCache, offlineItem];
      setOfflineCache(newOfflineCache);
      localStorage.setItem(offlineCacheKey, JSON.stringify(newOfflineCache));
      
      return { success: false, error: err, offline: true };
    } finally {
      setSaving(false);
    }
  }, [
    isOnline, offlineCache, table, validateBeforeSave, 
    transformBeforeSave, onSaveSuccess, onSaveError, offlineCacheKey
  ]);
  
  // Função para atualizar dados com salvamento automático
  const updateData = useCallback((newData) => {
    // Se for uma função, executá-la com os dados atuais
    const updatedData = typeof newData === 'function' 
      ? newData(data)
      : { ...data, ...newData };
    
    setData(updatedData);
    
    // Salvar no localStorage
    if (persistLocally) {
      localStorage.setItem(fullCacheKey, JSON.stringify(updatedData));
    }
    
    // Configurar salvamento automático após debounce
    if (saveInBackground) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveToSupabase(updatedData);
      }, debounceTime);
    }
    
    return updatedData;
  }, [data, persistLocally, fullCacheKey, saveInBackground, saveToSupabase, debounceTime]);
  
  // Função para forçar o salvamento imediato
  const save = useCallback(async (method = 'upsert') => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    return await saveToSupabase(data, method);
  }, [data, saveToSupabase]);
  
  // Função para limpar o cache
  const clearCache = useCallback(() => {
    if (persistLocally) {
      localStorage.removeItem(fullCacheKey);
    }
  }, [persistLocally, fullCacheKey]);
  
  return {
    data,
    updateData,
    save,
    saving,
    lastSaved,
    error,
    clearCache,
    isOnline,
    offlineChanges: offlineCache.length,
    syncOfflineData
  };
}