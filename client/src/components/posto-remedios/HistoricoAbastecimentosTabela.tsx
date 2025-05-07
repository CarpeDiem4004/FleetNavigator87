import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, FileDown, Search, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/context/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface Abastecimento {
  id: number;
  placa: string;
  km: number;
  projeto: string;
  motorista_nome: string;
  motorista_rg: string;
  tipo_combustivel?: string;
  quantidade_litros?: number;
  valor_litro?: number;
  valor_total?: number;
  lavagem: boolean;
  tipo_lavagem?: string;
  observacoes?: string;
  created_at: string;
  [key: string]: any; // Para permitir acesso dinâmico às propriedades
}

interface HistoricoAbastecimentosTabelaProps {
  posto?: string;
  endpoint?: string;
  titulo?: string;
  registros?: Abastecimento[];
  loading?: boolean;
  onRefresh?: () => void;
}

export default function HistoricoAbastecimentosTabela({ 
  posto = 'Remédios', 
  endpoint,
  titulo = 'Histórico de Abastecimentos',
  registros: externalRegistros,
  loading: externalLoading,
  onRefresh
}: HistoricoAbastecimentosTabelaProps) {
  const { toast } = useToast();
  const auth = useAuth(); // Para verificar se o usuário é admin
  const { user } = auth || {};
  const [internalRegistros, setInternalRegistros] = useState<Abastecimento[]>([]);
  const [filtroPlaca, setFiltroPlaca] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);
  const [carregado, setCarregado] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Verificar se o usuário é administrador
  const isAdmin = user?.role === 'admin';

  // Usar registros externos se fornecidos, caso contrário, usar internos
  const registros = externalRegistros || internalRegistros;
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;
  
  // Log para depuração
  console.log("[HISTÓRICO TABELA] Modo:", externalRegistros ? "Externo" : "Interno");
  console.log("[HISTÓRICO TABELA] Total de registros:", registros?.length || 0);
  console.log("[HISTÓRICO TABELA] Estado de carregamento:", loading);
  
  // Inicializar carregamento de dados ao montar o componente
  useEffect(() => {
    // Carregar registros na inicialização do componente
    carregarRegistros();
    
    // Atualizar registros automaticamente a cada 20 segundos
    const interval = setInterval(() => {
      console.log("[HISTÓRICO TABELA] Atualizando dados automaticamente...");
      carregarRegistros();
    }, 20000);
    
    // Função para limpar o intervalo quando o componente for desmontado
    return () => clearInterval(interval);
  }, []);
  
  // Atualizar quando o filtro de placa mudar
  useEffect(() => {
    // Se temos um filtro, vamos buscar após um curto delay (debounce simples)
    const timeoutId = setTimeout(() => {
      if (filtroPlaca.trim()) {
        carregarRegistros();
      }
    }, 800);
    
    // Limpar o timeout quando o componente for desmontado ou o filtro mudar novamente
    return () => clearTimeout(timeoutId);
  }, [filtroPlaca]);

  // Carregar registros - dependendo do modo (interno ou externo)
  const carregarRegistros = async () => {
    // Se temos uma função de atualização externa, usamos ela
    if (onRefresh) {
      onRefresh();
      return;
    }

    // Caso contrário, usamos a lógica interna (requer endpoint)
    if (!endpoint) {
      toast({
        title: 'Erro',
        description: 'Endpoint não fornecido para carregar registros',
        variant: 'destructive',
      });
      return;
    }

    setInternalLoading(true);
    try {
      const response = await fetch(`${endpoint}${filtroPlaca ? `?placa=${filtroPlaca}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        setInternalRegistros(data.data || []);
        setCarregado(true);
      } else {
        toast({
          title: 'Erro',
          description: 'Falha ao carregar registros',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar registros',
        variant: 'destructive',
      });
    } finally {
      setInternalLoading(false);
    }
  };

  // Exportar para Excel
  const exportarParaExcel = () => {
    if (registros.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Não há dados para exportar',
        variant: 'default',
      });
      return;
    }

    try {
      // Preparar dados para exportação com formatação apropriada
      const dadosParaExportar = registros.map(reg => ({
        'ID': reg.id,
        'Placa': reg.placa,
        'Quilometragem': reg.km,
        'Projeto': reg.projeto || '-',
        'Motorista': reg.motorista_nome,
        'RG Motorista': reg.motorista_rg,
        'Combustível': reg.tipo_combustivel || 'N/A',
        'Litros': reg.quantidade_litros ? Number(reg.quantidade_litros).toFixed(2) : '-',
        'Valor/Litro (R$)': reg.valor_litro ? `R$ ${Number(reg.valor_litro).toFixed(2)}` : '-',
        'Valor Total (R$)': reg.valor_total ? `R$ ${Number(reg.valor_total).toFixed(2)}` : '-',
        'Lavagem': reg.lavagem ? 'Sim' : 'Não',
        'Tipo Lavagem': reg.tipo_lavagem || 'N/A',
        'Observações': reg.observacoes || '',
        'Data/Hora': new Date(reg.created_at).toLocaleString('pt-BR')
      }));

      // Criar uma planilha
      const ws = XLSX.utils.json_to_sheet(dadosParaExportar);
      
      // Definir larguras de colunas para melhor visualização
      const wscols = [
        { wch: 6 },   // ID
        { wch: 10 },  // Placa
        { wch: 14 },  // Quilometragem
        { wch: 15 },  // Projeto
        { wch: 20 },  // Motorista
        { wch: 14 },  // RG Motorista
        { wch: 12 },  // Combustível
        { wch: 10 },  // Litros
        { wch: 14 },  // Valor/Litro (R$)
        { wch: 14 },  // Valor Total (R$)
        { wch: 8 },   // Lavagem
        { wch: 15 },  // Tipo Lavagem
        { wch: 30 },  // Observações
        { wch: 20 }   // Data/Hora
      ];
      ws['!cols'] = wscols;
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Abastecimentos");
      
      // Salvar o arquivo com nome descritivo
      const fileName = `historico_${posto.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: 'Sucesso',
        description: 'Exportação concluída com sucesso',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao exportar dados',
        variant: 'destructive',
      });
    }
  };

  // Formatar data
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR');
  };
  
  // Função para excluir registro
  const excluirRegistro = async () => {
    if (!deletingId) return;
    
    setDeleteLoading(true);
    try {
      // Obter token JWT do Auth Context para garantir que é o token mais recente
      const user = auth?.user;
      const token = localStorage.getItem('authToken');
      
      if (!user || !token) {
        console.error('Usuário não autenticado ou token ausente:', { user: !!user, token: !!token });
        toast({
          title: 'Erro de autenticação',
          description: 'Você precisa estar autenticado como administrador para excluir registros',
          variant: 'destructive',
        });
        return;
      }
      
      console.log('Autenticação para exclusão:', { 
        usuario: user.email, 
        role: user.role,
        tokenLength: token.length,
        tokenStart: token.substring(0, 10),
        tokenEnd: token.substring(token.length - 10)
      });
      
      // Verificar se o usuário tem permissão de admin
      if (user.role !== 'admin') {
        toast({
          title: 'Permissão negada',
          description: 'Apenas administradores podem excluir registros',
          variant: 'destructive', 
        });
        return;
      }
      
      // Fazer a requisição de exclusão
      const response = await fetch(`/api/posto-remedios/abastecimentos/${deletingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Incluir cookies para garantir que a sessão seja enviada
      });
      
      console.log('Resposta da exclusão:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        ok: response.ok
      });
      
      // Verificar resposta
      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Registro excluído com sucesso',
          variant: 'default',
        });
        
        // Atualizar a lista de registros
        carregarRegistros();
      } else {
        // Tentar obter detalhes do erro
        let errorMessage = 'Erro ao excluir registro';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `Erro ${response.status}: ${response.statusText}`;
          console.error('Detalhes do erro:', errorData);
        } catch (jsonError) {
          console.error('Erro ao processar resposta JSON:', jsonError);
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        
        toast({
          title: 'Falha na exclusão',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Exceção ao excluir registro:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao excluir registro',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingId(null);
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Diálogo de confirmação para exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="flex items-center gap-2 text-amber-500 mb-2">
                <AlertTriangle className="h-5 w-5" />
                Esta ação não pode ser desfeita.
              </span>
              Você tem certeza que deseja excluir o registro #{deletingId}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                excluirRegistro();
              }}
              disabled={deleteLoading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Excluindo...
                </>
              ) : (
                "Sim, excluir registro"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{titulo} - {posto}</h2>
        <div className="flex gap-2">
          <Button 
            onClick={carregarRegistros} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Atualizar
          </Button>
          <Button 
            onClick={exportarParaExcel} 
            variant="outline" 
            size="sm"
            disabled={registros.length === 0 || loading}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Input
          type="text"
          placeholder="Filtrar por placa"
          value={filtroPlaca}
          onChange={(e) => setFiltroPlaca(e.target.value)}
          className="max-w-xs"
        />
        <Button
          onClick={carregarRegistros}
          size="sm"
          disabled={loading}
        >
          <Search className="h-4 w-4 mr-2" />
          Buscar
        </Button>
      </div>

      {!carregado && !loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Clique em "Atualizar" para carregar os registros</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : registros.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>KM</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Motorista</TableHead>
                <TableHead>Combustível</TableHead>
                <TableHead>Litros</TableHead>
                <TableHead>Valor/L</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Lavagem</TableHead>
                <TableHead>Data</TableHead>
                {isAdmin && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {registros && registros.length > 0 ? registros.map((registro) => {
                console.log("[HISTÓRICO TABELA] Renderizando registro:", registro);
                return (
                  <TableRow key={registro.id}>
                    <TableCell>{registro.id}</TableCell>
                    <TableCell className="font-medium">{registro.placa}</TableCell>
                    <TableCell>{registro.km ? registro.km : '-'}</TableCell>
                    <TableCell>{registro.projeto ? registro.projeto : '-'}</TableCell>
                    <TableCell>{registro.motorista_nome ? registro.motorista_nome : '-'}</TableCell>
                    <TableCell>{registro.tipo_combustivel || '-'}</TableCell>
                    <TableCell>{typeof registro.quantidade_litros !== 'undefined' ? registro.quantidade_litros : '-'}</TableCell>
                    <TableCell>
                      {typeof registro.valor_litro !== 'undefined' && registro.valor_litro !== null
                        ? `R$ ${Number(registro.valor_litro).toFixed(2)}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {typeof registro.valor_total !== 'undefined' && registro.valor_total !== null
                        ? `R$ ${Number(registro.valor_total).toFixed(2)}`
                        : '-'}
                    </TableCell>
                    <TableCell>{registro.lavagem ? 'Sim' : 'Não'}</TableCell>
                    <TableCell>{registro.created_at ? formatarData(registro.created_at) : '-'}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeletingId(registro.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                          title="Excluir registro"
                          aria-label="Excluir registro"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              }) : null}
            </TableBody>
          </Table>
        </div>
      ) : carregado ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhum registro encontrado</p>
        </div>
      ) : null}
    </div>
  );
}