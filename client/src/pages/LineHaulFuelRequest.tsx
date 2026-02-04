import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Fuel, Camera, Check, Truck, MapPin, Phone, User, Clock, Package, Droplets, Gauge, CreditCard, AlertCircle, Edit, Shield, Heart, BookOpen, PhoneCall, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface VehiclePlate {
  placa: string;
  modelo?: string;
}

// Lista de rotas organizadas (Cidade – UF)
const ROTAS_LINE_HAUL = [
  "Aparecida – SP",
  "Araçatuba – SP",
  "Araucária – PR",
  "Araraquara – SP",
  "Artur Alvim – SP",
  "Assis – SP",
  "Bauru – SP",
  "Belo Horizonte – MG",
  "Betim – MG",
  "Campo Grande – MS",
  "Cascavel – PR",
  "Cordovil – RJ",
  "Cravinhos – SP",
  "Curitiba – PR",
  "Duque de Caxias – RJ",
  "Franca – SP",
  "Franco da Rocha – SP",
  "Goiânia – GO",
  "Guaratinguetá – SP",
  "Guarulhos – SP",
  "Itajaí – SC",
  "Itapeva – MG",
  "Itapeva – SP",
  "Itaquaquecetuba – SP",
  "Itirapina – SP",
  "Itupeva – SP",
  "Limeira – SP",
  "Louveira – SP",
  "Maringá – PR",
  "Mogi Guaçu – SP",
  "Mogi Mirim – SP",
  "Osasco – SP",
  "Patos de Minas – MG",
  "Ponta Grossa – PR",
  "Praia Grande – SP",
  "Ribeirão Preto – SP",
  "Rio de Janeiro – RJ",
  "Santana de Parnaíba – SP",
  "Santo André – SP",
  "São Bernardo ABC – SP",
  "São Bernardo do Campo – SP",
  "São Carlos – SP",
  "São João de Meriti – RJ",
  "São José – SC",
  "São José do Rio Preto – SP",
  "São Paulo – SP",
  "Sete Lagoas – MG",
  "Tatuí – SP",
  "Toledo – PR",
  "Tremembé – MG",
  "Três Lagoas – MS",
  "Tuiuti – SP",
  "Uberaba – MG",
];

export default function LineHaulFuelRequest() {
  const { toast } = useToast();
  
  // Estado para tela de conscientização - verifica sessionStorage
  const [aceitouConscientizacao, setAceitouConscientizacao] = useState(() => {
    return sessionStorage.getItem('linehaul_conscientizacao_aceita') === 'true';
  });
  const [checkboxCiente, setCheckboxCiente] = useState(false);
  
  const handleAceitarConscientizacao = () => {
    sessionStorage.setItem('linehaul_conscientizacao_aceita', 'true');
    setAceitouConscientizacao(true);
  };
  
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    placa: "",
    kmVeiculo: "",
    localInicio: "",
    destino: "",
    horarioAbastecimento: "",
    operacao: "mercado_livre" as "mercado_livre" | "shopee",
    provedorCartao: "veloe" as "veloe" | "ticket",
    arla: false,
    placaCartao: "",
    retornoVazio: false,
  });

  const [fotoPainel, setFotoPainel] = useState<File | null>(null);
  const [fotoCartao, setFotoCartao] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [loadingDistance, setLoadingDistance] = useState(false);

  // Validação de placa brasileira (antiga ABC1234 ou Mercosul ABC1D23)
  const validarPlaca = (placa: string): boolean => {
    if (!placa) return true; // Campo opcional, vazio é válido
    const regex = /^([A-Z]{3}[0-9]{4}|[A-Z]{3}[0-9][A-Z][0-9]{2})$/;
    return regex.test(placa.toUpperCase());
  };

  const isPlacaCartaoValida = validarPlaca(form.placaCartao);

  // Função para verificar se um horário deve estar desabilitado (já passou)
  const isHorarioPassado = (horario: string): boolean => {
    if (!horario || horario === "Após 18h") return false; // "Após 18h" sempre liberado
    
    const agora = new Date();
    const horaAtual = agora.getHours() + agora.getMinutes() / 60;
    
    const [hora, minuto] = horario.split(":").map(Number);
    const horarioOpcao = hora + (minuto || 0) / 60;
    
    return horarioOpcao <= horaAtual;
  };
  
  const [allPlates, setAllPlates] = useState<VehiclePlate[]>([]);
  const [filteredPlates, setFilteredPlates] = useState<VehiclePlate[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const plateInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Estados para autocomplete de rotas
  const [filteredOrigins, setFilteredOrigins] = useState<string[]>([]);
  const [filteredDestinations, setFilteredDestinations] = useState<string[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const originInputRef = useRef<HTMLInputElement>(null);
  const originSuggestionsRef = useRef<HTMLDivElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const destinationSuggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadPlates() {
      try {
        const response = await fetch("/api/public/linehaul/vehicles");
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.vehicles)) {
            setAllPlates(data.vehicles);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar placas:", err);
      }
    }
    loadPlates();
  }, []);

  useEffect(() => {
    if (form.placa.length >= 1 && allPlates.length > 0) {
      const filtered = allPlates.filter(v => 
        v.placa.toUpperCase().includes(form.placa.toUpperCase())
      ).slice(0, 8);
      setFilteredPlates(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredPlates([]);
      setShowSuggestions(false);
    }
  }, [form.placa, allPlates]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Fechar sugestões de placa
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        plateInputRef.current &&
        !plateInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
      // Fechar sugestões de origem
      if (
        originSuggestionsRef.current && 
        !originSuggestionsRef.current.contains(event.target as Node) &&
        originInputRef.current &&
        !originInputRef.current.contains(event.target as Node)
      ) {
        setShowOriginSuggestions(false);
      }
      // Fechar sugestões de destino
      if (
        destinationSuggestionsRef.current && 
        !destinationSuggestionsRef.current.contains(event.target as Node) &&
        destinationInputRef.current &&
        !destinationInputRef.current.contains(event.target as Node)
      ) {
        setShowDestinationSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtrar rotas de origem conforme digita
  useEffect(() => {
    if (form.localInicio.length >= 1) {
      const filtered = ROTAS_LINE_HAUL.filter(rota => 
        rota.toLowerCase().includes(form.localInicio.toLowerCase())
      ).slice(0, 8);
      setFilteredOrigins(filtered);
      setShowOriginSuggestions(filtered.length > 0);
    } else {
      setFilteredOrigins([]);
      setShowOriginSuggestions(false);
    }
  }, [form.localInicio]);

  // Filtrar rotas de destino conforme digita
  useEffect(() => {
    if (form.destino.length >= 1) {
      const filtered = ROTAS_LINE_HAUL.filter(rota => 
        rota.toLowerCase().includes(form.destino.toLowerCase())
      ).slice(0, 8);
      setFilteredDestinations(filtered);
      setShowDestinationSuggestions(filtered.length > 0);
    } else {
      setFilteredDestinations([]);
      setShowDestinationSuggestions(false);
    }
  }, [form.destino]);

  function selectPlate(plate: VehiclePlate) {
    setForm({ ...form, placa: plate.placa });
    setShowSuggestions(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!form.kmVeiculo || form.kmVeiculo.trim() === '' || parseInt(form.kmVeiculo) <= 0) {
      toast({
        title: "KM obrigatório",
        description: "Por favor, informe a quilometragem do veículo.",
        variant: "destructive",
      });
      return;
    }
    
    if (!fotoPainel) {
      toast({
        title: "Foto obrigatória",
        description: "Por favor, tire uma foto do painel (km).",
        variant: "destructive",
      });
      return;
    }
    
    if (!fotoCartao) {
      toast({
        title: "Foto obrigatória",
        description: "Por favor, tire uma foto do cartão.",
        variant: "destructive",
      });
      return;
    }

    // Validar placa do cartão se preenchida
    if (form.placaCartao && !validarPlaca(form.placaCartao)) {
      toast({
        title: "Placa inválida",
        description: "A placa do cartão deve estar no formato ABC1234 (antigo) ou ABC1D23 (Mercosul).",
        variant: "destructive",
      });
      return;
    }

    // Buscar distância da rota antes de mostrar confirmação
    setLoadingDistance(true);
    try {
      const response = await fetch(`/api/public/linehaul/route-distance?origem=${encodeURIComponent(form.localInicio)}&destino=${encodeURIComponent(form.destino)}`);
      const data = await response.json();
      if (data.success && data.distancia_km > 0) {
        setRouteDistance(data.distancia_km);
      } else {
        setRouteDistance(0);
      }
    } catch (err) {
      console.error("Erro ao buscar distância:", err);
      setRouteDistance(0);
    } finally {
      setLoadingDistance(false);
    }

    setShowConfirmation(true);
  }

  async function confirmSubmit() {
    setShowConfirmation(false);
    setLoading(true);

    try {
      const plateClean = form.placa.replace(/\s/g, "").toUpperCase();

      const formData = new FormData();
      formData.append("motorista_nome", form.nome);
      formData.append("telefone_motorista", form.telefone);
      formData.append("veiculo_placa", plateClean);
      formData.append("km_veiculo", form.kmVeiculo);
      formData.append("rota_origem", form.localInicio);
      formData.append("rota_destino", form.destino);
      formData.append("data_abastecimento", new Date().toISOString().split('T')[0]);
      formData.append("horario_abastecimento", form.horarioAbastecimento);
      formData.append("operacao", form.operacao);
      formData.append("provedor_cartao", form.provedorCartao);
      formData.append("incluir_arla", form.arla ? "true" : "false");
      formData.append("retorno_vazio", form.retornoVazio ? "true" : "false");
      formData.append("data_solicitacao", new Date().toISOString().split('T')[0]);
      formData.append("horario_solicitacao", new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      formData.append("foto_painel", fotoPainel!);
      formData.append("foto_cartao", fotoCartao!);
      if (form.placaCartao) {
        formData.append("placa_cartao", form.placaCartao);
      }

      const response = await fetch("/api/public/linehaul/fuel-request", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Solicitação enviada!",
          description: "Sua solicitação foi registrada e será analisada pelo operador.",
        });
        setSubmitted(true);
      } else {
        throw new Error(data.message || "Erro ao enviar solicitação");
      }
    } catch (err: any) {
      console.error("Erro ao enviar:", err);
      toast({
        title: "Erro ao enviar",
        description: err.message || "Ocorreu um erro ao enviar a solicitação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Tela de Conscientização Obrigatória
  if (!aceitouConscientizacao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 p-4 overflow-y-auto">
        <Card className="w-full max-w-lg mx-auto shadow-2xl border-0 linehaul-abastecimento my-4">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg pb-6">
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-center text-xl font-bold">
              Segurança em Primeiro Lugar
            </CardTitle>
          </CardHeader>
          
          <div>
            <CardContent className="pt-6 pb-4 space-y-5">
              {/* Mensagem Principal */}
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <p className="text-lg font-semibold text-green-800 text-center italic">
                  "Seu destino mais importante é voltar para casa em segurança."
                </p>
              </div>

              {/* Dicas de Segurança */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 text-sm">
                    <strong>Respeite o limite de velocidade</strong>
                  </p>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 text-sm">
                    <strong>Mantenha a distância segura:</strong> o tempo de reação do veículo é influenciado pelo peso e tamanho. Dê espaço para a segurança.
                  </p>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 text-sm">
                    <strong>Faça pausas e descanse:</strong> cansaço aumenta o risco de acidentes.
                  </p>
                </div>
              </div>

              {/* Seção de Treinamentos */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-5 w-5 text-amber-600" />
                  <h3 className="font-bold text-amber-800">Treinamentos</h3>
                </div>
                
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p>Realize os treinamentos obrigatórios no <strong>App Logistic</strong> — o Meli disponibiliza novos temas com frequência, fique atento.</p>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p>Realize os treinamentos obrigatórios do <strong>SEST SENAT</strong></p>
                      <ul className="ml-4 mt-1 space-y-1 text-gray-600">
                        <li>• Direção Defensiva</li>
                        <li>• Como evitar acidentes em rodovias</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mensagem Emocional */}
              <div className="bg-green-100 border border-green-300 rounded-lg p-4 text-center">
                <p className="text-green-800 font-semibold text-lg flex items-center justify-center gap-2">
                  <Heart className="h-5 w-5 text-green-600" />
                  Alguém espera por você. Dirija com SEGURANÇA. 💚
                </p>
              </div>

            </CardContent>
          </div>

          {/* Área inferior */}
          <div className="p-4 space-y-3 border-t">
            {/* Contato de Emergência */}
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3">
              <p className="text-red-800 text-sm flex items-start gap-2 font-medium">
                <PhoneCall className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span>
                  Em caso de qualquer ocorrência, por mais simples que pareça, <strong>acione imediatamente nosso time</strong>. 📞🤝
                </span>
              </p>
            </div>

            {/* Checkbox de Aceite */}
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border-2 border-green-300">
              <Checkbox
                id="ciente"
                checked={checkboxCiente}
                onCheckedChange={(checked) => setCheckboxCiente(checked === true)}
                className="h-6 w-6 border-2 border-green-500 data-[state=checked]:bg-green-600"
                data-testid="checkbox-ciente"
              />
              <Label htmlFor="ciente" className="cursor-pointer text-green-800 font-semibold text-base">
                Li e estou ciente
              </Label>
            </div>

            {/* Botão Continuar */}
            <Button
              onClick={handleAceitarConscientizacao}
              disabled={!checkboxCiente}
              className={`w-full h-14 text-lg font-bold transition-all ${
                checkboxCiente 
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              data-testid="button-continuar-solicitacao"
            >
              {checkboxCiente ? (
                <>
                  <Check className="mr-2 h-6 w-6" />
                  Continuar para Solicitação
                </>
              ) : (
                'Marque acima para continuar'
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Solicitação Enviada!
            </h2>
            <p className="text-gray-600 mb-4">
              Sua solicitação foi registrada e será analisada pelo operador. O valor do abastecimento será calculado automaticamente com base na rota.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-sm font-medium flex items-center gap-2">
                <span className="text-lg">📱</span>
                Você receberá uma mensagem automática via WhatsApp assim que o saldo for colocado no cartão.
              </p>
            </div>
            <Button 
              onClick={() => {
                setSubmitted(false);
                setForm({
                  nome: "",
                  telefone: "",
                  placa: "",
                  kmVeiculo: "",
                  localInicio: "",
                  destino: "",
                  horarioAbastecimento: "",
                  operacao: "mercado_livre",
                  provedorCartao: "veloe",
                  arla: false,
                  placaCartao: "",
                  retornoVazio: false,
                });
                setFotoPainel(null);
                setFotoCartao(null);
              }}
              className="w-full"
              data-testid="button-new-request"
            >
              Nova Solicitação
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 p-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
            <Fuel className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Solicitação de Abastecimento
          </h1>
          <p className="text-blue-200 mt-1">Line Haul</p>
        </div>

        <Card className="shadow-xl linehaul-abastecimento">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Dados da Solicitação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome do Motorista *
                </Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Digite seu nome completo"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  required
                  data-testid="input-driver-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone *
                </Label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  required
                  data-testid="input-phone"
                />
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="placa" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Placa do Veículo *
                </Label>
                <Input
                  ref={plateInputRef}
                  id="placa"
                  type="text"
                  placeholder="ABC1D23"
                  value={form.placa}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
                    setForm({ ...form, placa: value });
                  }}
                  onFocus={() => {
                    if (filteredPlates.length > 0) setShowSuggestions(true);
                  }}
                  required
                  maxLength={7}
                  autoComplete="off"
                  className={form.placa && form.placa.length !== 7 ? 'border-red-500 focus:ring-red-500' : ''}
                  data-testid="input-plate"
                />
                {form.placa && form.placa.length !== 7 && (
                  <p className="text-xs text-red-500 font-medium">
                    A placa deve ter exatamente 7 caracteres
                  </p>
                )}
                {showSuggestions && filteredPlates.length > 0 && (
                  <div 
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                  >
                    {filteredPlates.map((plate, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectPlate(plate)}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                      >
                        <Truck className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-gray-900">{plate.placa}</span>
                        {plate.modelo && (
                          <span className="text-sm text-gray-500">({plate.modelo})</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="kmVeiculo" className="flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Km do Veículo *
                </Label>
                <Input
                  id="kmVeiculo"
                  type="number"
                  placeholder="Ex: 150000"
                  value={form.kmVeiculo}
                  onChange={(e) => setForm({ ...form, kmVeiculo: e.target.value })}
                  required
                  min={0}
                  data-testid="input-km"
                />
              </div>

              {/* Checkbox Retorno Vazio */}
              <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <Checkbox
                  id="retornoVazio"
                  checked={form.retornoVazio}
                  onCheckedChange={(checked) => {
                    setForm({ 
                      ...form, 
                      retornoVazio: checked === true,
                      localInicio: checked === true ? "RETORNO VAZIO" : "",
                      destino: checked === true ? "RETORNO VAZIO" : ""
                    });
                  }}
                  data-testid="checkbox-retorno-vazio"
                />
                <Label htmlFor="retornoVazio" className="flex items-center gap-2 cursor-pointer">
                  <Truck className="h-5 w-5 text-orange-600" />
                  <div>
                    <span className="font-semibold text-orange-900">Retorno Vazio?</span>
                    <p className="text-xs text-orange-700">Marque se o veículo está retornando sem rota definida</p>
                  </div>
                </Label>
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="localInicio" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Local de Início {!form.retornoVazio && '*'}
                </Label>
                <Input
                  ref={originInputRef}
                  id="localInicio"
                  type="text"
                  placeholder={form.retornoVazio ? "Retorno vazio - sem rota" : "Digite para buscar..."}
                  value={form.localInicio}
                  onChange={(e) => setForm({ ...form, localInicio: e.target.value })}
                  onFocus={() => {
                    if (!form.retornoVazio && form.localInicio.length >= 1 && filteredOrigins.length > 0) {
                      setShowOriginSuggestions(true);
                    }
                  }}
                  required={!form.retornoVazio}
                  disabled={form.retornoVazio}
                  autoComplete="off"
                  data-testid="input-origin"
                  className={form.retornoVazio ? "bg-gray-100 text-gray-500" : ""}
                />
                {showOriginSuggestions && filteredOrigins.length > 0 && (
                  <div
                    ref={originSuggestionsRef}
                    className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto"
                  >
                    {filteredOrigins.map((rota, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, localInicio: rota });
                          setShowOriginSuggestions(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                      >
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="text-gray-900">{rota}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="destino" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Destino {!form.retornoVazio && '*'}
                </Label>
                <Input
                  ref={destinationInputRef}
                  id="destino"
                  type="text"
                  placeholder={form.retornoVazio ? "Retorno vazio - sem rota" : "Digite para buscar..."}
                  value={form.destino}
                  onChange={(e) => setForm({ ...form, destino: e.target.value })}
                  onFocus={() => {
                    if (!form.retornoVazio && form.destino.length >= 1 && filteredDestinations.length > 0) {
                      setShowDestinationSuggestions(true);
                    }
                  }}
                  required={!form.retornoVazio}
                  disabled={form.retornoVazio}
                  autoComplete="off"
                  data-testid="input-destination"
                  className={form.retornoVazio ? "bg-gray-100 text-gray-500" : ""}
                />
                {showDestinationSuggestions && filteredDestinations.length > 0 && (
                  <div
                    ref={destinationSuggestionsRef}
                    className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto"
                  >
                    {filteredDestinations.map((rota, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, destino: rota });
                          setShowDestinationSuggestions(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                      >
                        <MapPin className="h-4 w-4 text-green-600" />
                        <span className="text-gray-900">{rota}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="horario" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horário Previsto *
                </Label>
                <select
                  id="horario"
                  value={form.horarioAbastecimento}
                  onChange={(e) => setForm({ ...form, horarioAbastecimento: e.target.value })}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  data-testid="select-horario"
                >
                  <option value="">Selecione o horário</option>
                  <option value="08:00" disabled={isHorarioPassado("08:00")}>08:00 {isHorarioPassado("08:00") ? "(indisponível)" : ""}</option>
                  <option value="10:00" disabled={isHorarioPassado("10:00")}>10:00 {isHorarioPassado("10:00") ? "(indisponível)" : ""}</option>
                  <option value="12:00" disabled={isHorarioPassado("12:00")}>12:00 {isHorarioPassado("12:00") ? "(indisponível)" : ""}</option>
                  <option value="14:00" disabled={isHorarioPassado("14:00")}>14:00 {isHorarioPassado("14:00") ? "(indisponível)" : ""}</option>
                  <option value="16:00" disabled={isHorarioPassado("16:00")}>16:00 {isHorarioPassado("16:00") ? "(indisponível)" : ""}</option>
                  <option value="Após 18h">Após 18h</option>
                </select>
              </div>

              <div className="space-y-3 pt-2">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Package className="h-4 w-4" />
                  Operação *
                </Label>
                <RadioGroup
                  value={form.operacao}
                  onValueChange={(value: "mercado_livre" | "shopee") => 
                    setForm({ ...form, operacao: value })
                  }
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="relative">
                    <RadioGroupItem
                      value="mercado_livre"
                      id="mercado_livre"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="mercado_livre"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-yellow-500 peer-data-[state=checked]:bg-yellow-50 cursor-pointer transition-all"
                      data-testid="radio-mercado-livre"
                    >
                      <span className="text-lg font-bold text-yellow-600">MERCADO LIVRE</span>
                      <span className="text-xs text-gray-500 mt-1">Operação ML</span>
                    </Label>
                  </div>
                  <div className="relative">
                    <RadioGroupItem
                      value="shopee"
                      id="shopee"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="shopee"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-orange-50 cursor-pointer transition-all"
                      data-testid="radio-shopee"
                    >
                      <span className="text-lg font-bold text-orange-600">SHOPEE</span>
                      <span className="text-xs text-gray-500 mt-1">Operação Shopee</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3 pt-2">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Fuel className="h-4 w-4" />
                  Tipo de Cartão *
                </Label>
                <RadioGroup
                  value={form.provedorCartao}
                  onValueChange={(value: "veloe" | "ticket") => 
                    setForm({ ...form, provedorCartao: value })
                  }
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="relative">
                    <RadioGroupItem
                      value="veloe"
                      id="veloe"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="veloe"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 cursor-pointer transition-all"
                      data-testid="radio-veloe"
                    >
                      <span className="text-lg font-bold text-blue-600">VELOE</span>
                      <span className="text-xs text-gray-500 mt-1">Cartão Veloe</span>
                    </Label>
                  </div>
                  <div className="relative">
                    <RadioGroupItem
                      value="ticket"
                      id="ticket"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="ticket"
                      className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-orange-600 peer-data-[state=checked]:bg-orange-50 cursor-pointer transition-all"
                      data-testid="radio-ticket"
                    >
                      <span className="text-lg font-bold text-orange-600">TICKET</span>
                      <span className="text-xs text-gray-500 mt-1">Cartão Ticket</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Checkbox
                  id="arla"
                  checked={form.arla}
                  onCheckedChange={(checked) => setForm({ ...form, arla: checked === true })}
                  data-testid="checkbox-arla"
                />
                <Label htmlFor="arla" className="flex items-center gap-2 cursor-pointer">
                  <Droplets className="h-5 w-5 text-blue-600" />
                  <div>
                    <span className="font-semibold text-blue-900">Precisa de ARLA?</span>
                    <p className="text-xs text-blue-600">Marque se precisar abastecer ARLA</p>
                  </div>
                </Label>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="flex items-center gap-2 text-red-600 font-semibold">
                  <Camera className="h-4 w-4" />
                  Foto do Painel (Km) * OBRIGATÓRIA
                </Label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setFotoPainel(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    data-testid="input-photo-panel"
                    id="foto-painel"
                    required
                  />
                  <div className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 border-dashed transition-all ${fotoPainel ? 'border-green-500 bg-green-50' : 'border-red-300 bg-red-50 hover:bg-red-100'}`}>
                    <Camera className={`h-8 w-8 ${fotoPainel ? 'text-green-600' : 'text-red-600'}`} />
                    <div className="text-left">
                      <p className={`font-semibold ${fotoPainel ? 'text-green-700' : 'text-red-700'}`}>
                        {fotoPainel ? 'Foto capturada!' : 'Tirar Foto do Painel'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {fotoPainel ? fotoPainel.name : 'Toque para abrir a câmera'}
                      </p>
                    </div>
                    {fotoPainel && <Check className="h-6 w-6 text-green-600" />}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-red-600 font-semibold">
                  <Camera className="h-4 w-4" />
                  Foto do Cartão * OBRIGATÓRIA
                </Label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setFotoCartao(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    data-testid="input-photo-card"
                    id="foto-cartao"
                    required
                  />
                  <div className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 border-dashed transition-all ${fotoCartao ? 'border-green-500 bg-green-50' : 'border-red-300 bg-red-50 hover:bg-red-100'}`}>
                    <Camera className={`h-8 w-8 ${fotoCartao ? 'text-green-600' : 'text-red-600'}`} />
                    <div className="text-left">
                      <p className={`font-semibold ${fotoCartao ? 'text-green-700' : 'text-red-700'}`}>
                        {fotoCartao ? 'Foto capturada!' : 'Tirar Foto do Cartão'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {fotoCartao ? fotoCartao.name : 'Toque para abrir a câmera'}
                      </p>
                    </div>
                    {fotoCartao && <Check className="h-6 w-6 text-green-600" />}
                  </div>
                </div>
              </div>

              {/* Campo para Placa do Cartão que vai receber o saldo */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-blue-600 font-semibold">
                  <CreditCard className="h-4 w-4" />
                  Placa do Cartão (Recebe o Saldo)
                </Label>
                <Input
                  type="text"
                  placeholder="ABC1D23"
                  value={form.placaCartao}
                  onChange={(e) => {
                    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    if (value.length > 7) return;
                    
                    // Regras posição por posição para placa brasileira
                    const rules = [
                      /[A-Z]/, // 1ª letra
                      /[A-Z]/, // 2ª letra
                      /[A-Z]/, // 3ª letra
                      /[0-9]/, // 4º número
                      /[A-Z0-9]/, // 5º (número antigo OU letra Mercosul)
                      /[0-9]/, // 6º número
                      /[0-9]/, // 7º número
                    ];
                    
                    for (let i = 0; i < value.length; i++) {
                      if (!rules[i].test(value[i])) {
                        return; // Bloqueia digitação inválida
                      }
                    }
                    
                    setForm({ ...form, placaCartao: value });
                  }}
                  maxLength={7}
                  className="uppercase"
                  data-testid="input-placa-cartao"
                />
                <p className="text-xs text-gray-500">
                  Informe a placa do cartão que receberá o crédito (se diferente da placa do veículo)
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border text-center">
                <p className="text-sm text-gray-600">
                  O <strong>valor do abastecimento</strong> será calculado automaticamente pelo sistema com base na rota informada.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full mt-6 h-12 text-lg"
                disabled={loading || !fotoPainel || !fotoCartao}
                data-testid="button-submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Fuel className="mr-2 h-5 w-5" />
                    Enviar Solicitação
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-blue-200 text-sm mt-4">
          Line Haul - Gestão de Frota
        </p>
      </div>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Confirmar Solicitação
            </DialogTitle>
            <DialogDescription>
              Por favor, verifique os dados antes de enviar:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Motorista:</span>
                <span className="font-medium text-gray-900">{form.nome}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Placa Veículo:</span>
                <span className="font-medium text-gray-900">{form.placa}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">KM do Veículo:</span>
                <span className="font-medium text-gray-900">{parseInt(form.kmVeiculo || '0').toLocaleString('pt-BR')} km</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Origem:</span>
                <span className="font-medium text-gray-900">{form.localInicio}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Destino:</span>
                <span className="font-medium text-gray-900">{form.destino}</span>
              </div>
              <div className="flex justify-between items-center border-t border-blue-200 pt-2 mt-2 bg-blue-100 rounded px-2 py-1">
                <span className="text-sm text-blue-700 font-medium">KM da Rota:</span>
                <span className="font-bold text-lg text-blue-700">
                  {routeDistance > 0 
                    ? `${routeDistance.toLocaleString('pt-BR')} km` 
                    : loadingDistance 
                      ? 'Calculando...' 
                      : 'Não cadastrada'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Horário:</span>
                <span className="font-medium text-gray-900">{form.horarioAbastecimento}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Operação:</span>
                <span className="font-medium text-gray-900">{form.operacao === 'mercado_livre' ? 'Mercado Livre' : 'Shopee'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tipo Cartão:</span>
                <span className="font-medium text-gray-900">{form.provedorCartao === 'veloe' ? 'Veloe Go' : 'Ticket Log'}</span>
              </div>
              <div className="flex justify-between items-center border-t border-blue-200 pt-2 mt-2 bg-amber-50 rounded px-2 py-1">
                <span className="text-sm text-amber-700 font-medium">Placa do Cartão (Saldo):</span>
                <span className="font-bold text-amber-800">{form.placaCartao || form.placa}</span>
              </div>
              {form.arla && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Arla:</span>
                  <span className="font-medium text-green-600">Incluir R$ 50,00</span>
                </div>
              )}
            </div>
            
            <p className="text-sm text-amber-600 text-center font-medium">
              Está tudo correto?
            </p>
          </div>
          
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              className="flex-1"
              data-testid="button-edit"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              onClick={confirmSubmit}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={loading}
              data-testid="button-confirm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Confirmar e Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
