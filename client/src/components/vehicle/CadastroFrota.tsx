import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/hooks/use-toast'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { validateAndFormatPlate, applyPlateMask, getPlateFormatHint } from '@/lib/plate-utils'

interface Props {
  onVehicleAdded?: () => void;
}

export default function CadastroFrota({ onVehicleAdded }: Props = {}) {
  const { toast } = useToast()
  const [placa, setPlaca] = useState('')
  const [plateValidation, setPlateValidation] = useState<ReturnType<typeof validateAndFormatPlate> | null>(null)
  const [marca, setMarca] = useState('')
  const [marcaCustomizada, setMarcaCustomizada] = useState('')
  const [modeloVeiculo, setModeloVeiculo] = useState('')
  const [ano, setAno] = useState<number | undefined>(undefined)
  const [tipoCombustivel, setTipoCombustivel] = useState('Diesel')
  const [mediaConsumo, setMediaConsumo] = useState<number | undefined>(undefined)
  const [tipoVeiculo, setTipoVeiculo] = useState('carreta')
  const [baseId, setBaseId] = useState<string | undefined>(undefined)
  const [ownership, setOwnership] = useState('murici') // Alterado de 'proprio' para 'murici'
  const [leasingCompany, setLeasingCompany] = useState('')
  const [bases, setBases] = useState<{id: number, nome: string}[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Estado para cartão de abastecimento (Line Hall apenas)
  const [cartaoAbastecimento, setCartaoAbastecimento] = useState('')
  
  // Novos estados para os arquivos
  const [crlvFile, setCrlvFile] = useState<File | null>(null)
  const [anttFile, setAnttFile] = useState<File | null>(null)
  
  // Estados para armazenar as URLs dos documentos no Supabase
  const [crlvUrl, setCrlvUrl] = useState<string | null>(null)
  const [anttUrl, setAnttUrl] = useState<string | null>(null)
  
  // Estados para controlar o carregamento dos arquivos
  const [isUploadingCrlv, setIsUploadingCrlv] = useState(false)
  const [isUploadingAntt, setIsUploadingAntt] = useState(false)

  // Opções de tipo de veículo seguindo os valores válidos do enum vehicleType
  const tiposVeiculo = [
    { id: 'fiorino', nome: 'Fiorino' },
    { id: 'van', nome: 'Van' },
    { id: 'vuc', nome: 'VUC' },
    { id: 'toco', nome: 'Toco' },
    { id: 'truck', nome: 'Truck' },
    { id: 'cavalo_mecanico', nome: 'Cavalo Mecânico' },
    { id: 'carreta', nome: 'Carreta' }
  ]

  // Opções de tipo de combustível
  const tiposCombustivel = [
    { id: 'Diesel', nome: 'Diesel' },
    { id: 'Gasolina', nome: 'Gasolina' },
    { id: 'Etanol', nome: 'Etanol' },
    { id: 'GNV', nome: 'GNV' },
    { id: 'Flex', nome: 'Flex' }
  ]

  // Mapeamento de marcas com rendimento médio (km/l)
  const rendimentoPorMarca: { [key: string]: number } = {
    'Iveco': 2.5,
    'Volvo': 2.7,
    'Volkswagen Constellation': 2.5,
    'Volkswagen Meteor': 2.7,
    'Mercedes': 2.5,
    'Man': 2.6,
    'Scania': 2.7,
    'Daf': 2.7
  }

  // Função para lidar com mudanças na placa
  const handlePlacaChange = (value: string) => {
    const maskedValue = applyPlateMask(value);
    setPlaca(maskedValue);
    
    // Validar a placa em tempo real
    const validation = validateAndFormatPlate(maskedValue);
    setPlateValidation(validation);
  };

  // Função para atualizar consumo quando marca for selecionada
  const handleMarcaChange = (novaMarca: string) => {
    setMarca(novaMarca)
    
    // Limpar marca customizada se não for "Outros"
    if (novaMarca !== "Outros") {
      setMarcaCustomizada('')
    }
    
    // Se existe um rendimento padrão para esta marca, atualizar automaticamente
    if (rendimentoPorMarca[novaMarca]) {
      setMediaConsumo(rendimentoPorMarca[novaMarca])
      toast({
        title: "Consumo atualizado automaticamente",
        description: `Rendimento médio de ${rendimentoPorMarca[novaMarca]} km/l aplicado para ${novaMarca}`,
      })
    }
  }

  // Função para limpar campos relacionados quando tipo de veículo mudar
  const handleTipoVeiculoChange = (novoTipo: string) => {
    setTipoVeiculo(novoTipo)
    
    // Se não for cavalo mecânico, limpar marca e consumo médio
    if (novoTipo !== 'cavalo_mecanico') {
      setMarca('')
      setMarcaCustomizada('')
      setMediaConsumo(undefined)
    }
    
    // Se for carreta, limpar o cartão de abastecimento
    if (novoTipo === 'carreta') {
      setCartaoAbastecimento('')
    }
  }

  // Função para verificar se deve mostrar o campo de cartão de abastecimento
  const shouldShowCartaoAbastecimento = () => {
    // Só mostra para veículos do Line Hall (base_id 3) e que não sejam carretas
    return baseId === '3' && tipoVeiculo !== 'carreta'
  }

  // Função para definir consumo automático para Line Hall
  const handleBaseChange = (novaBase: string) => {
    setBaseId(novaBase)
    
    // Se for Line Hall Shopee (base_id 3), definir consumo automático de 2.5 km/l
    if (novaBase === '3') {
      setMediaConsumo(2.5)
      toast({
        title: "Consumo definido automaticamente",
        description: "Média de 2.5 km/l aplicada para veículos do Line Hall Shopee",
      })
    }
  }

  // Função para fazer upload de arquivos via API do servidor
  const uploadFileToServer = async (file: File, folder: string, vehiclePlate: string): Promise<string | null> => {
    if (!file) return null;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('vehiclePlate', vehiclePlate);
      
      const response = await fetch('/api/upload-vehicle-document', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro no upload: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro desconhecido no upload');
      }
      
      return result.url;
    } catch (error) {
      console.error(`Erro ao fazer upload do arquivo ${folder}:`, error);
      toast({
        title: `Erro ao enviar ${folder === 'crlv' ? 'CRLV' : 'ANTT'}`,
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao enviar o arquivo.',
        variant: 'destructive'
      });
      return null;
    }
  };
  
  // Handler para upload de CRLV
  const handleCrlvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCrlvFile(file);
    
    if (placa) {
      setIsUploadingCrlv(true);
      try {
        const url = await uploadFileToServer(file, 'crlv', placa);
        if (url) {
          setCrlvUrl(url);
          toast({
            title: 'CRLV enviado',
            description: 'Documento CRLV enviado com sucesso.',
            variant: 'default'
          });
        }
      } finally {
        setIsUploadingCrlv(false);
      }
    } else {
      toast({
        title: 'Placa não informada',
        description: 'Informe a placa do veículo antes de enviar o CRLV.',
        variant: 'destructive'
      });
    }
  };
  
  // Handler para upload de ANTT
  const handleAnttUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setAnttFile(file);
    
    if (placa) {
      setIsUploadingAntt(true);
      try {
        const url = await uploadFileToServer(file, 'antt', placa);
        if (url) {
          setAnttUrl(url);
          toast({
            title: 'ANTT enviado',
            description: 'Documento ANTT enviado com sucesso.',
            variant: 'default'
          });
        }
      } finally {
        setIsUploadingAntt(false);
      }
    } else {
      toast({
        title: 'Placa não informada',
        description: 'Informe a placa do veículo antes de enviar o ANTT.',
        variant: 'destructive'
      });
    }
  };
  
  useEffect(() => {
    async function fetchBases() {
      try {
        // Usar a API REST em vez do cliente Supabase diretamente
        const response = await fetch('/api/bases');
        if (!response.ok) {
          throw new Error(`Erro ao buscar bases: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Bases carregadas da API:', data);
        
        // Adaptar o formato da resposta da API para o formato esperado pelo componente
        const formattedBases = data.map((base: any) => ({
          id: base.id,
          nome: base.name || base.nome // Lidar com ambos os formatos possíveis
        }));
        
        setBases(formattedBases);
      } catch (error) {
        console.error('Erro ao buscar bases:', error);
        toast({
          title: 'Erro ao carregar bases',
          description: 'Não foi possível carregar a lista de bases.',
          variant: 'destructive'
        });
      }
    }

    fetchBases();
  }, [toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!placa || !marca || !baseId) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive'
      })
      return
    }
    
    // Validar formato da placa
    if (!plateValidation?.isValid) {
      toast({
        title: 'Placa inválida',
        description: 'Digite uma placa válida no formato antigo (ABC1234) ou Mercosul (ABC1D23).',
        variant: 'destructive'
      })
      return
    }
    
    // Validar empresa de locação para veículos locados
    if (ownership === 'locado' && !leasingCompany) {
      toast({
        title: 'Empresa de locação obrigatória',
        description: 'Informe a empresa de locação para veículos locados.',
        variant: 'destructive'
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Realizar upload dos documentos se ainda não foram carregados
      if (crlvFile && !crlvUrl) {
        const url = await uploadFileToServer(crlvFile, 'crlv', placa);
        if (url) setCrlvUrl(url);
      }
      
      if (anttFile && !anttUrl) {
        const url = await uploadFileToServer(anttFile, 'antt', placa);
        if (url) setAnttUrl(url);
      }
      
      // Usar a API REST em vez do cliente Supabase
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plate: plateValidation.formatted, // Usar a placa formatada
          model: modeloVeiculo, // Modelo do veículo (ex: Cargo 2422)
          make: marca === "Outros" ? marcaCustomizada : marca, // Marca do veículo (ex: Ford)
          vehicleType: tipoVeiculo, // Tipo de veículo (carreta, cavalo_mecanico, etc)
          year: ano,
          fuelType: tipoCombustivel,
          mediaConsumoCombutivel: mediaConsumo,
          status: 'em_operacao',
          baseId: parseInt(baseId),
          ownership: ownership,
          rentalCompany: ownership === 'locado' ? leasingCompany : null,
          crlvUrl: crlvUrl, // Adicionar URL do CRLV
          anttUrl: anttUrl, // Adicionar URL do ANTT
          cartaoAbastecimento: shouldShowCartaoAbastecimento() ? cartaoAbastecimento : null, // Campo específico para Line Hall
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Verificar se é um erro de placa duplicada (código de status 409)
        if (response.status === 409 && errorData.code === 'DUPLICATE_PLATE') {
          throw new Error(`A placa ${placa} já está cadastrada no sistema. Verifique e tente novamente.`);
        }
        
        throw new Error(errorData.message || 'Erro ao cadastrar veículo');
      }
      
      const vehicleData = await response.json();
      
      toast({
        title: 'Veículo cadastrado',
        description: `Veículo ${placa} cadastrado com sucesso.`,
        variant: 'default'
      })
      
      // Limpar formulário após sucesso
      setPlaca('')
      setMarca('')
      setModeloVeiculo('')
      setAno(undefined)
      setTipoCombustivel('Diesel')
      setMediaConsumo(undefined)
      setTipoVeiculo('carreta')
      setBaseId(undefined)
      setOwnership('murici')
      setLeasingCompany('')
      
      // Notificar o componente pai sobre a adição
      if (onVehicleAdded) {
        onVehicleAdded()
      }
    } catch (error) {
      console.error('Exceção ao cadastrar veículo:', error)
      toast({
        title: 'Erro ao cadastrar veículo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Cadastro de Frota</CardTitle>
        <CardDescription>
          Adicione um novo veículo à frota
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="placa">Placa *</Label>
            <div className="relative">
              <Input
                id="placa"
                type="text"
                placeholder="ABC1234 ou ABC1D23"
                value={placa}
                onChange={(e) => handlePlacaChange(e.target.value)}
                required
                className={`uppercase pr-10 ${
                  plateValidation?.isValid === true ? 'border-green-500' : 
                  plateValidation?.isValid === false && placa.length > 0 ? 'border-red-500' : ''
                }`}
                maxLength={8}
              />
              {plateValidation && placa.length > 0 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {plateValidation.isValid ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
            {placa.length > 0 && (
              <p className={`text-xs ${
                plateValidation?.isValid ? 'text-green-600' : 'text-gray-600'
              }`}>
                {plateValidation?.isValid ? 
                  `✓ Placa válida - Formato ${plateValidation.type}${plateValidation.type === 'antiga' ? ' (ABC-1234)' : ' (ABC1D23)'}` :
                  getPlateFormatHint(placa)
                }
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="marca">Marca *</Label>
            {tipoVeiculo === 'cavalo_mecanico' ? (
              <>
                <Select value={marca} onValueChange={handleMarcaChange}>
                  <SelectTrigger id="marca">
                    <SelectValue placeholder="Selecione a marca do cavalo mecânico" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(rendimentoPorMarca).map((marcaOption) => (
                      <SelectItem key={marcaOption} value={marcaOption}>
                        {marcaOption} ({rendimentoPorMarca[marcaOption]} km/l)
                      </SelectItem>
                    ))}
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
                {marca === "Outros" && (
                  <Input
                    type="text"
                    placeholder="Digite a marca"
                    value={marcaCustomizada}
                    onChange={(e) => setMarcaCustomizada(e.target.value)}
                    className="mt-2"
                    required
                  />
                )}
              </>
            ) : (
              <Input
                id="marca"
                type="text"
                placeholder="Ex: Ford"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                required
              />
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="modeloVeiculo">Modelo</Label>
            <Input
              id="modeloVeiculo"
              type="text"
              placeholder="Ex: Cargo 2422"
              value={modeloVeiculo}
              onChange={(e) => setModeloVeiculo(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ano">Ano</Label>
              <Input
                id="ano"
                type="number"
                placeholder="Ex: 2023"
                value={ano || ''}
                onChange={(e) => setAno(e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipoCombustivel">Tipo de Combustível</Label>
              <Select value={tipoCombustivel} onValueChange={setTipoCombustivel}>
                <SelectTrigger id="tipoCombustivel">
                  <SelectValue placeholder="Selecione o combustível" />
                </SelectTrigger>
                <SelectContent>
                  {tiposCombustivel.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mediaConsumo">Média de Consumo (km/l)</Label>
              <Input
                id="mediaConsumo"
                type="number"
                step="0.1"
                placeholder="Ex: 2.5"
                value={mediaConsumo || ''}
                onChange={(e) => setMediaConsumo(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipoVeiculo">Tipo de Veículo *</Label>
              <Select value={tipoVeiculo} onValueChange={handleTipoVeiculoChange}>
                <SelectTrigger id="tipoVeiculo">
                  <SelectValue placeholder="Selecione o tipo de veículo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposVeiculo.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="base">Base *</Label>
            <Select value={baseId || undefined} onValueChange={setBaseId}>
              <SelectTrigger id="base">
                <SelectValue placeholder="Selecione a Base" />
              </SelectTrigger>
              <SelectContent>
                {bases.map((b) => (
                  <SelectItem key={b.id} value={b.id.toString()}>{b.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownership">Propriedade *</Label>
            <Select 
              value={ownership} 
              onValueChange={(value) => {
                setOwnership(value);
                // Limpar o campo de empresa quando mudar para próprio
                if (value === 'murici') {
                  setLeasingCompany('');
                }
              }}
            >
              <SelectTrigger id="ownership">
                <SelectValue placeholder="Selecione a propriedade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="murici">Murici</SelectItem>
                <SelectItem value="locado">Locado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {ownership === 'locado' && (
            <div className="space-y-2">
              <Label htmlFor="leasingCompany">Empresa de Locação *</Label>
              <Input
                id="leasingCompany"
                type="text"
                placeholder="Ex: Localiza"
                value={leasingCompany}
                onChange={(e) => setLeasingCompany(e.target.value)}
                required={ownership === 'locado'}
              />
            </div>
          )}

          {/* Campo específico para cartão de abastecimento do Line Hall */}
          {shouldShowCartaoAbastecimento() && (
            <div className="space-y-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <Label htmlFor="cartaoAbastecimento" className="text-blue-700 font-medium">
                Cartão de Abastecimento Line Hall
              </Label>
              <Input
                id="cartaoAbastecimento"
                type="text"
                placeholder="Ex: CARD001 ou ABC-1234"
                value={cartaoAbastecimento}
                onChange={(e) => setCartaoAbastecimento(e.target.value)}
                className="border-blue-300"
              />
              <p className="text-sm text-blue-600">
                Número ou placa do cartão de abastecimento que será usado por este veículo nas solicitações.
              </p>
            </div>
          )}
          
          {/* Campo de upload do CRLV */}
          <div className="space-y-2">
            <Label htmlFor="crlvFile" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              CRLV (Certificado de Registro e Licenciamento)
            </Label>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  id="crlvFile"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleCrlvUpload}
                  className="flex-1"
                  disabled={isUploadingCrlv}
                />
                {isUploadingCrlv && (
                  <div className="animate-spin h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                )}
              </div>
              {crlvUrl && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <FileText className="h-4 w-4" />
                  <span>Documento CRLV anexado</span>
                  <a href={crlvUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Visualizar
                  </a>
                </div>
              )}
            </div>
          </div>
          
          {/* Campo de upload do ANTT */}
          <div className="space-y-2">
            <Label htmlFor="anttFile" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              ANTT (Agência Nacional de Transportes Terrestres)
            </Label>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  id="anttFile"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleAnttUpload}
                  className="flex-1"
                  disabled={isUploadingAntt}
                />
                {isUploadingAntt && (
                  <div className="animate-spin h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                )}
              </div>
              {anttUrl && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <FileText className="h-4 w-4" />
                  <span>Documento ANTT anexado</span>
                  <a href={anttUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Visualizar
                  </a>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Processando...
              </span>
            ) : (
              'Cadastrar Veículo'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}