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

const SeletorProjetos: React.FC<SeletorProjetosProps> = ({
  value,
  onChange,
  className = "",
  required = false
}) => {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Para detectar se o componente ainda está montado
  const isMounted = useRef(true);
  // Para alternar para modo de compatibilidade se detectarmos problemas em dispositivos móveis
  const [useFallbackMode, setUseFallbackMode] = useState(false);
  
  // Detectar ambiente móvel
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /iphone|ipad|ipod|android|blackberry|windows phone/g.test(userAgent);
      if (isMobile) {
        console.log("Dispositivo móvel detectado, usando modo de compatibilidade para seletor de projetos");
        setUseFallbackMode(true);
      }
    };
    
    checkMobile();
  }, []);

  useEffect(() => {
    // Adicionar tratamento de erro global para capturar problemas DOM
    const handleError = (event: ErrorEvent) => {
      if (event.message && event.message.includes('removeChild')) {
        console.warn('Erro DOM detectado, ativando modo de compatibilidade:', event.message);
        setUseFallbackMode(true);
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
    const carregarProjetos = async () => {
      try {
        setIsLoading(true);
        
        // Lista padrão de projetos que será usada em caso de falha na API
        const projetosPadrao = [
          { id: 1, nome: 'NÃO ESPECIFICADO', ativo: true, ordem: 1 },
          { id: 2, nome: 'GRUPO PEREIRA', ativo: true, ordem: 2 },
          { id: 3, nome: 'COCA COLA', ativo: true, ordem: 3 },
          { id: 4, nome: 'SHOPEE', ativo: true, ordem: 4 },
          { id: 5, nome: 'MERCADO LIVRE', ativo: true, ordem: 5 },
          { id: 6, nome: 'LINE HALL SHOPEE', ativo: true, ordem: 6 },
          { id: 7, nome: 'FULL MELI', ativo: true, ordem: 7 },
          { id: 8, nome: 'MADEIRA MADEIRA', ativo: true, ordem: 8 },
          { id: 9, nome: 'MAGALU', ativo: true, ordem: 9 },
          { id: 10, nome: 'NATURA', ativo: true, ordem: 10 },
          { id: 11, nome: 'OXXO', ativo: true, ordem: 11 },
          { id: 12, nome: 'PETLOVE', ativo: true, ordem: 12 },
          { id: 13, nome: 'REMÉDIOS', ativo: true, ordem: 13 },
          { id: 14, nome: 'OUTRO', ativo: true, ordem: 14 }
        ];
        
        try {
          const response = await apiRequest('GET', '/api/projetos');
          const data = await response.json();
          
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            if (isMounted.current) {
              setProjetos(data.data);
            }
          } else {
            // Se não foi possível carregar, use a lista padrão
            if (isMounted.current) {
              setProjetos(projetosPadrao);
              console.warn('Usando lista de projetos padrão:', data);
            }
          }
        } catch (err) {
          console.error('Erro ao carregar projetos:', err);
          if (isMounted.current) {
            setError('Não foi possível carregar a lista de projetos');
            // Mesmo com erro, use a lista padrão para não bloquear o usuário
            setProjetos(projetosPadrao);
          }
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    carregarProjetos();
  }, []);

  // Renderizar uma versão simplificada para dispositivos móveis para evitar problemas com o DOM
  if (useFallbackMode) {
    return (
      <div className={className}>
        <label htmlFor="projeto" className="block text-sm font-medium text-gray-500 mb-1">
          Projeto {required && <span className="text-red-500">*</span>}
        </label>
        <select
          id="projeto"
          value={value?.toString() || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 bg-background px-3 py-2"
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

  // Versão normal com o componente UI Select
  return (
    <div className={className}>
      <Label htmlFor="projeto" className={`text-muted-foreground ${required ? 'required' : ''}`}>
        Projeto
      </Label>
      <Select
        value={value?.toString() || ''}
        onValueChange={(val) => {
          try {
            onChange(val);
          } catch (error) {
            console.error("Erro ao selecionar projeto:", error);
            // Se houver erro, ativar modo de compatibilidade
            setUseFallbackMode(true);
            // Tentar novamente com setTimeout
            setTimeout(() => {
              if (isMounted.current) {
                onChange(val);
              }
            }, 0);
          }
        }}
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