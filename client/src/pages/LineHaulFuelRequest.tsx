import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Fuel, Camera, Check, Truck, MapPin, Phone, User, Clock, Package, Droplets, Gauge } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    placa: "",
    kmVeiculo: "",
    localInicio: "",
    destino: "",
    dataAbastecimento: "",
    horarioAbastecimento: "",
    operacao: "mercado_livre" as "mercado_livre" | "shopee",
    provedorCartao: "veloe" as "veloe" | "ticket",
    arla: false,
  });

  const [fotoPainel, setFotoPainel] = useState<File | null>(null);
  const [fotoCartao, setFotoCartao] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
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
      formData.append("data_abastecimento", form.dataAbastecimento);
      formData.append("horario_abastecimento", form.horarioAbastecimento);
      formData.append("operacao", form.operacao);
      formData.append("provedor_cartao", form.provedorCartao);
      formData.append("incluir_arla", form.arla ? "true" : "false");
      formData.append("data_solicitacao", new Date().toISOString().split('T')[0]);
      formData.append("horario_solicitacao", new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      formData.append("foto_painel", fotoPainel);
      formData.append("foto_cartao", fotoCartao);

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
                  dataAbastecimento: "",
                  horarioAbastecimento: "",
                  operacao: "mercado_livre",
                  provedorCartao: "veloe",
                  arla: false,
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

        <Card className="shadow-xl">
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
                  placeholder="Digite para buscar..."
                  value={form.placa}
                  onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })}
                  onFocus={() => {
                    if (filteredPlates.length > 0) setShowSuggestions(true);
                  }}
                  required
                  maxLength={7}
                  autoComplete="off"
                  data-testid="input-plate"
                />
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

              <div className="space-y-2 relative">
                <Label htmlFor="localInicio" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Local de Início *
                </Label>
                <Input
                  ref={originInputRef}
                  id="localInicio"
                  type="text"
                  placeholder="Digite para buscar..."
                  value={form.localInicio}
                  onChange={(e) => setForm({ ...form, localInicio: e.target.value })}
                  onFocus={() => {
                    if (form.localInicio.length >= 1 && filteredOrigins.length > 0) {
                      setShowOriginSuggestions(true);
                    }
                  }}
                  required
                  autoComplete="off"
                  data-testid="input-origin"
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
                  Destino *
                </Label>
                <Input
                  ref={destinationInputRef}
                  id="destino"
                  type="text"
                  placeholder="Digite para buscar..."
                  value={form.destino}
                  onChange={(e) => setForm({ ...form, destino: e.target.value })}
                  onFocus={() => {
                    if (form.destino.length >= 1 && filteredDestinations.length > 0) {
                      setShowDestinationSuggestions(true);
                    }
                  }}
                  required
                  autoComplete="off"
                  data-testid="input-destination"
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
                <Label htmlFor="dataAbastecimento" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Data do Abastecimento *
                </Label>
                <Input
                  id="dataAbastecimento"
                  type="date"
                  value={form.dataAbastecimento}
                  onChange={(e) => setForm({ ...form, dataAbastecimento: e.target.value })}
                  required
                  data-testid="input-date"
                />
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
                  <option value="08:00">08:00</option>
                  <option value="10:00">10:00</option>
                  <option value="12:00">12:00</option>
                  <option value="14:00">14:00</option>
                  <option value="16:00">16:00</option>
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
    </div>
  );
}
