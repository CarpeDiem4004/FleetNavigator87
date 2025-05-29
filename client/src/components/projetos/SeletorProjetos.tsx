import React, { useEffect, useState, useRef } from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from '@/lib/queryClient';

type Projeto = {
  id: number;
  nome: string;
  ativo: boolean;
  ordem: number;
}

interface SeletorProjetosProps {
  value?: string | number;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
}

// Lista padrão de projetos que será usada em caso de falha na API - atualizada
const PROJETOS_PADRAO: Projeto[] = [
  { id: 1, nome: 'NÃO ESPECIFICADO', ativo: true, ordem: 1 },
  { id: 2, nome: 'SHOPEE', ativo: true, ordem: 2 },
  { id: 3, nome: 'MERCADO LIVRE', ativo: true, ordem: 3 },
  { id: 4, nome: 'COCA COLA', ativo: true, ordem: 4 },
  { id: 5, nome: 'GRUPO PEREIRA', ativo: true, ordem: 5 },
  { id: 6, nome: 'MADEIRA MADEIRA', ativo: true, ordem: 6 },
  { id: 7, nome: 'OXXO', ativo: true, ordem: 7 },
  { id: 8, nome: 'MANUTENÇÃO', ativo: true, ordem: 8 },
  { id: 9, nome: 'MAGALU', ativo: true, ordem: 9 },
  { id: 10, nome: 'NATURA', ativo: true, ordem: 10 },
  { id: 11, nome: 'LINE HALL SHOPEE', ativo: true, ordem: 11 },
  { id: 12, nome: 'FULL MELI', ativo: true, ordem: 12 },
  { id: 13, nome: 'PETLOVE', ativo: true, ordem: 13 },
  { id: 14, nome: 'USO OPERACIONAL', ativo: true, ordem: 14 },
  { id: 15, nome: 'OUTRO', ativo: true, ordem: 15 }
];

// Verificar se a URL atual é uma URL de acesso externo para postos
const isExternalPostoUrl = (): boolean => {
  const currentUrl = window.location.href.toLowerCase();
  const externalPatterns = [
    '/public',
    '/posto/',
    '_v2/public',
    'abc_v2',
    'osasco_v2',
    'posto_remedios'
  ];
  
  return externalPatterns.some(pattern => currentUrl.includes(pattern));
};

// Verificar se estamos em um dispositivo móvel
const isMobileDevice = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod|android|blackberry|windows phone/g.test(userAgent);
};

const SeletorProjetos: React.FC<SeletorProjetosProps> = ({
  value,
  onChange,
  className = "",
  required = false
}) => {
  const [projetos, setProjetos] = useState<Projeto[]>(PROJETOS_PADRAO);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  
  // Usar sempre o modo de compatibilidade (select nativo) para postos externos e dispositivos móveis
  // Isso previne problemas com o DOM em vários contextos
  const isExternal = isExternalPostoUrl();
  const isMobile = isMobileDevice();
  const shouldUseFallbackMode = isExternal || isMobile;
  
  useEffect(() => {
    // Adicionar tratamento de erro global para capturar problemas DOM
    const handleError = (event: ErrorEvent) => {
      if (event.message && event.message.includes('removeChild') || 
          event.message && event.message.includes('child of this node')) {
        console.warn('Erro DOM detectado, prevenindo travamento:', event.message);
        event.preventDefault();
      }
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Se estamos em um contexto externo de posto, usar sempre a lista padrão
    // para evitar problemas de rede ou autenticação
    if (isExternal) {
      if (isMounted.current) {
        setIsLoading(false);
        console.log('Usando lista de projetos padrão para acesso externo');
      }
      return;
    }
    
    const carregarProjetos = async () => {
      try {
        setIsLoading(true);
        
        const response = await apiRequest('GET', '/api/projetos');
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          if (isMounted.current) {
            setProjetos(data.data);
          }
        } else {
          // Se não foi possível carregar, use a lista padrão
          if (isMounted.current) {
            console.warn('Usando lista de projetos padrão (API retornou dados inválidos)');
          }
        }
      } catch (err) {
        console.error('Erro ao carregar projetos:', err);
        if (isMounted.current) {
          setError('Não foi possível carregar a lista de projetos');
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    carregarProjetos();
  }, [isExternal]);

  // Renderizar sempre uma versão simplificada para dispositivos móveis e acesso externo
  if (shouldUseFallbackMode) {
    return (
      <div className={className}>
        <label htmlFor="projeto" className="block text-sm font-medium text-gray-500 mb-1">
          Projeto {required && <span className="text-red-500">*</span>}
        </label>
        <select
          id="projeto"
          name="projeto"
          value={value?.toString() || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
          className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 bg-background"
          style={{
            minHeight: '42px',
            fontSize: '16px',
            WebkitAppearance: 'menulist',
            appearance: 'menulist'
          }}
          required={required}
        >
          <option value="">Selecione um projeto</option>
          {projetos.map((projeto) => (
            <option 
              key={projeto.id} 
              value={projeto.nome}
              disabled={!projeto.ativo}
            >
              {projeto.nome}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Versão normal com o componente UI Select (apenas para acesso interno não-móvel)
  return (
    <div className={className}>
      <Label htmlFor="projeto" className={`text-muted-foreground ${required ? 'required' : ''}`}>
        Projeto
      </Label>
      <Select
        value={value?.toString() || ''}
        onValueChange={onChange}
        disabled={isLoading}
      >
        <SelectTrigger id="projeto" className="w-full">
          <SelectValue placeholder="Selecione um projeto" />
        </SelectTrigger>
        <SelectContent>
          {error && (
            <div className="p-2 text-sm text-destructive">{error}</div>
          )}
          {projetos.map((projeto) => (
            <SelectItem 
              key={projeto.id} 
              value={projeto.nome}
              disabled={!projeto.ativo}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{projeto.nome}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SeletorProjetos;