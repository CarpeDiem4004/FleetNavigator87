import React, { useState } from 'react';
import AppLayout from "@/components/layout/AppLayout";
import { getSupabaseClient } from '@/lib/supabase-compat';
import { apiRequest } from '@/lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, Upload, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const UploadDocumentoPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [descricao, setDescricao] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('NF');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(false);
    }
  };

  // Função para verificar e criar o bucket se necessário via backend
  const ensureBucketExists = async (bucketName: string) => {
    try {
      console.log(`[Frontend] Verificando bucket '${bucketName}' via backend...`);
      
      const response = await fetch('/api/storage/buckets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Importante para incluir cookies de sessão
        body: JSON.stringify({ bucketName }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao verificar/criar bucket');
      }
      
      const data = await response.json();
      console.log(`[Frontend] Bucket verificado:`, data.message);
      
      return true;
    } catch (error) {
      console.error('[Frontend] Erro ao verificar/criar bucket:', error);
      throw error;
    }
  };

  // Função para sanitizar nomes de arquivo para uso seguro no Supabase
  const sanitizeFileName = (fileName: string): string => {
    // Remover acentos
    const withoutAccents = fileName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Substituir espaços por underscores
    const withoutSpaces = withoutAccents.replace(/\s+/g, '_');
    
    // Remover caracteres especiais, mantendo apenas letras, números, underscore, ponto e hífen
    return withoutSpaces.replace(/[^\w.-]/g, '');
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor, selecione um arquivo para upload.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Sanitizar o nome do arquivo para evitar problemas com caracteres especiais
      const originalFileName = file.name;
      const sanitizedFileName = sanitizeFileName(file.name);
      
      // Define o caminho do arquivo no Supabase Storage
      const baseId = '2'; // ID da Base Campinas
      const filePath = `campinas/documentos/${Date.now()}_${sanitizedFileName}`;
      const bucketName = 'budget-attachments';
      
      console.log('Iniciando upload para:', { 
        bucketName, 
        filePath, 
        fileSize: file.size, 
        originalFileName,
        sanitizedFileName 
      });
      
      // Garantir que o bucket existe via backend
      try {
        await ensureBucketExists(bucketName);
        console.log('[Frontend] Bucket verificado com sucesso.');
      } catch (bucketError) {
        console.error('[Frontend] Erro durante a verificação do bucket:', bucketError);
        throw bucketError; // Parar se falhar ao verificar bucket
      }
      
      // Fazer upload via backend usando FormData
      console.log('[Frontend] Enviando arquivo via backend...');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucketName', bucketName);
      formData.append('filePath', 'campinas/documentos'); // Pasta base
      
      const uploadResponse = await fetch('/api/storage/upload', {
        method: 'POST',
        credentials: 'include', // Importante para incluir cookies de sessão
        body: formData, // Não definir Content-Type, o navegador define automaticamente com boundary
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Erro no upload');
      }
      
      const uploadData = await uploadResponse.json();
      console.log('[Frontend] Upload bem-sucedido via backend!', uploadData);
      
      const publicUrl = uploadData.publicUrl;
      
      // Obter o token JWT para autenticação
      const token = localStorage.getItem('authToken');
      
      // Debug do token
      console.log('Token JWT para autenticação:', token ? token.substring(0, 20) + '...' : 'não encontrado');
      
      // Também verificar se há token jwt_token (nome antigo)
      const oldToken = localStorage.getItem('jwt_token');
      if (oldToken) {
        console.log('Token JWT antigo encontrado (jwt_token):', oldToken.substring(0, 20) + '...');
      }

      // Registrar o documento no banco de dados com token JWT
      const response = await fetch('/api/budget-attachments/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          budget_request_id: null, // Não está vinculado a uma solicitação específica
          base_id: baseId,
          base_name: 'Base Campinas',
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_path: filePath,
          storage_url: publicUrl,
          attachment_type: tipoDocumento,
          description: descricao
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao registrar documento no banco de dados');
      }
      
      setSuccess(true);
      setFile(null);
      setDescricao('');
      
      toast({
        title: "Documento enviado com sucesso",
        description: `O arquivo "${file.name}" foi armazenado permanentemente.`,
        // @ts-ignore
        variant: "success"
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido no upload';
      setError(errorMessage);
      
      toast({
        title: "Erro ao enviar documento",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-4">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload de Documentos</CardTitle>
            <CardDescription>
              Upload de documentos diretamente para armazenamento permanente no Supabase Storage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="mb-4">
                <Check className="h-4 w-4" />
                <AlertTitle>Sucesso</AlertTitle>
                <AlertDescription>Documento enviado com sucesso para armazenamento permanente.</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de documento</label>
                <Select 
                  value={tipoDocumento}
                  onValueChange={(value) => setTipoDocumento(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NF">Nota Fiscal</SelectItem>
                    <SelectItem value="Orcamento">Orçamento</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <Textarea
                  placeholder="Descreva o documento..."
                  className="resize-none"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Arquivo</label>
                <div className="border border-gray-300 rounded-md p-4">
                  <Input
                    type="file"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  
                  {file && (
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <FileText className="h-4 w-4 mr-1" />
                      <span>{file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
                    </div>
                  )}
                </div>
              </div>
              
              <Button
                className="w-full"
                onClick={handleUpload}
                disabled={loading || !file}
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-1" />
                    Enviar Documento
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default UploadDocumentoPage;