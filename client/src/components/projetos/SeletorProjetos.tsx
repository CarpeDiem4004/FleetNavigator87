import React, { useEffect, useState } from 'react';
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
  label?: string;
  className?: string;
  required?: boolean;
}

const SeletorProjetos: React.FC<SeletorProjetosProps> = ({
  value,
  onChange,
  label = "Projeto",
  className = "",
  required = false
}) => {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const carregarProjetos = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest('GET', '/api/projetos');
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setProjetos(data.data);
        } else {
          // Se não foi possível carregar, use uma lista padrão
          setProjetos([
            { id: 1, nome: 'NÃO ESPECIFICADO', ativo: true, ordem: 1 },
            { id: 2, nome: 'MERCADO LIVRE', ativo: true, ordem: 2 },
            { id: 3, nome: 'OUTRO', ativo: true, ordem: 3 }
          ]);
          console.warn('Usando lista de projetos padrão:', data);
        }
      } catch (err) {
        console.error('Erro ao carregar projetos:', err);
        setError('Não foi possível carregar a lista de projetos');
        
        // Mesmo com erro, use uma lista padrão para não bloquear o usuário
        setProjetos([
          { id: 1, nome: 'NÃO ESPECIFICADO', ativo: true, ordem: 1 },
          { id: 2, nome: 'MERCADO LIVRE', ativo: true, ordem: 2 },
          { id: 3, nome: 'OUTRO', ativo: true, ordem: 3 }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    carregarProjetos();
  }, []);

  return (
    <div className={className}>
      <Label htmlFor="projeto" className={`text-muted-foreground ${required ? 'required' : ''}`}>
        {label}
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