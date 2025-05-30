import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Truck, CheckCircle, XCircle, Clock } from 'lucide-react';

const vehicles = [
  { model: "Mercedes", plate: "SYH6260", card: "SDG2353" },
  { model: "Volvo", plate: "STH6274", card: "RMC8819" },
  { model: "Mercedes", plate: "SWJ6256", card: "SWJ6256" },
  { model: "Mercedes", plate: "SY96310", card: "SWJ6610" },
  { model: "Volvo", plate: "STY3464", card: "SDG3367" },
  { model: "Volvo", plate: "SYH8283", card: "RMO2439" },
  { model: "Volkswagen Constellation", plate: "FNU8854", card: "FNU8854" },
  { model: "Volvo", plate: "SWI2315", card: "SWI2501" },
  { model: "Volkswagen Constellation", plate: "FLN6165", card: "SWG5157" },
  { model: "Volvo", plate: "QFT3470", card: "SWM3630" },
  { model: "Volvo", plate: "SSQ3557", card: "RNB8848" },
  { model: "Volvo", plate: "SYG3348", card: "RNG2939" },
  { model: "Volkswagen Constellation", plate: "FVY2806", card: "QPC3681" },
  { model: "Mercedes", plate: "SWY1108", card: "SWY1108" },
  { model: "Iveco", plate: "FLA5335", card: "RRM1021" },
  { model: "Volkswagen Constellation", plate: "GKB5556", card: "GKB5556" },
  { model: "Volvo", plate: "STQ7605", card: "STQ7606" },
  { model: "Volvo", plate: "GSB5809", card: "FHD0551" },
  { model: "Volkswagen Constellation", plate: "FDP9554", card: "SWG5027" },
  { model: "Mercedes", plate: "TME3867", card: "SDG3105" },
  { model: "Volvo", plate: "SWG9322", card: "RLH5398" },
  { model: "Volkswagen Constellation", plate: "FAZ7531", card: "RNJ6565" },
  { model: "Volvo", plate: "GKC1950", card: "SWN5631" },
  { model: "Volvo", plate: "SYQ6157", card: "RNJ3516" },
  { model: "Volkswagen Constellation", plate: "FZF3646", card: "SWH8570" },
  { model: "Volvo", plate: "FQA3837", card: "RNR2528" },
  { model: "Volvo", plate: "SWR6425", card: "RNS3935" },
  { model: "Volvo", plate: "SYH6887", card: "RME3107" },
  { model: "Volvo", plate: "SST5795", card: "RMJ2140" },
  { model: "Volvo", plate: "SSU5906", card: "RNJ4306" },
  { model: "Volvo", plate: "QPG4831", card: "QPC4058" },
  { model: "Volvo", plate: "SWS6395", card: "RVL4056" },
  { model: "Volkswagen Constellation", plate: "SWM5531", card: "RNB3662" },
  { model: "Volvo", plate: "STQ4924", card: "RNJ9672" },
  { model: "Volvo", plate: "FQA7674", card: "FQA7674" },
  { model: "Volkswagen Constellation", plate: "FQU5181", card: "GYS8072" },
  { model: "Volvo", plate: "SSU5906", card: "RNS4100" },
  { model: "Man", plate: "GSF5F56", card: "GFM5444" },
  { model: "Volvo", plate: "SUR5635", card: "RNS4835" },
  { model: "Mercedes", plate: "TLN5197", card: "RUG7556" },
  { model: "Volkswagen Constellation", plate: "FVG", card: "SWN2360" },
  { model: "Mercedes", plate: "STU6520", card: "FQP5264" },
  { model: "Volvo", plate: "FQI9372", card: "RUV3100" },
  { model: "Volvo", plate: "STT8D28", card: "SWG5035" },
  { model: "Volvo", plate: "STQ9F05", card: "SUQ2500" },
  { model: "Volkswagen Constellation", plate: "FRM8125", card: "RNJ9820" },
  { model: "Mercedes", plate: "QMK8556", card: "QMK8556" },
  { model: "Volvo", plate: "FLR8177", card: "SUQ2560" },
  { model: "Mercedes", plate: "SWR5644", card: "SWR5644" },
  { model: "Mercedes", plate: "SUR7634", card: "SDG3119" },
  { model: "Iveco", plate: "GKB5118", card: "QFR5718" },
  { model: "Mercedes", plate: "SWI9125", card: "SWF1525" },
  { model: "Volvo", plate: "FYN2495", card: "SWF2753" },
  { model: "Volvo", plate: "SSU5906", card: "RUV3633" },
  { model: "Volkswagen Constellation", plate: "FAZ7531", card: "SWG4556" },
  { model: "Volkswagen Constellation", plate: "FZF3646", card: "SWA8376" },
  { model: "Volvo", plate: "STT8H25", card: "SWD8308" },
  { model: "Volkswagen Constellation", plate: "FWI1552", card: "FWI1552" },
  { model: "Volvo", plate: "QPG4831", card: "RNJ3839" },
  { model: "Volvo", plate: "SWG9322", card: "SJQ0657" },
  { model: "Volkswagen Constellation", plate: "QHG5443", card: "QHG5443" },
  { model: "Volvo", plate: "SWG9322", card: "SWG9322" },
  { model: "Volvo", plate: "GTE5637", card: "RNS8377" },
  { model: "Volvo", plate: "SWU2361", card: "SWU2361" },
  { model: "Volvo", plate: "SLK7834", card: "SLK7834" },
  { model: "Volkswagen Constellation", plate: "FNY2856", card: "QFC3681" }
];

interface RegistrationStatus {
  plate: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
}

export default function LineHallVehicleRegistration() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [registrationResults, setRegistrationResults] = useState<RegistrationStatus[]>([]);
  const { toast } = useToast();

  const getConsumptionByBrand = (model: string) => {
    if (model.includes('Mercedes')) return 2.5;
    if (model.includes('Volvo')) return 2.7;
    if (model.includes('Volkswagen')) return 2.6;
    if (model.includes('Man')) return 2.6;
    if (model.includes('Iveco')) return 2.4;
    return 2.5;
  };

  const registerVehicle = async (vehicleData: typeof vehicles[0]) => {
    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plate: vehicleData.plate,
          model: vehicleData.model,
          make: vehicleData.model.includes('Volkswagen') ? 'Volkswagen' : vehicleData.model.split(' ')[0],
          vehicleType: 'cavalo_mecanico',
          year: 2020,
          fuelType: 'diesel',
          mediaConsumoCombutivel: getConsumptionByBrand(vehicleData.model),
          status: 'em_operacao',
          baseId: 3, // Line Hall Shopee
          ownership: 'murici',
          rentalCompany: null,
          crlvUrl: null,
          anttUrl: null,
          cartaoAbastecimento: vehicleData.card
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      throw error;
    }
  };

  const startRegistration = async () => {
    setIsRegistering(true);
    setCurrentIndex(0);
    setRegistrationResults([]);

    for (let i = 0; i < vehicles.length; i++) {
      const vehicle = vehicles[i];
      setCurrentIndex(i + 1);

      try {
        await registerVehicle(vehicle);
        setRegistrationResults(prev => [...prev, {
          plate: vehicle.plate,
          status: 'success',
          message: `Cadastrado com sucesso - Cartão: ${vehicle.card}`
        }]);
      } catch (error: any) {
        setRegistrationResults(prev => [...prev, {
          plate: vehicle.plate,
          status: 'error',
          message: error.message
        }]);
      }

      // Pequena pausa entre cadastros
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setIsRegistering(false);
    
    const successCount = registrationResults.filter(r => r.status === 'success').length;
    const errorCount = registrationResults.filter(r => r.status === 'error').length;
    
    toast({
      title: "Cadastro finalizado",
      description: `Sucessos: ${successCount} | Erros: ${errorCount}`,
      variant: successCount > errorCount ? 'default' : 'destructive'
    });
  };

  const progress = (currentIndex / vehicles.length) * 100;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Cadastro em Lote - Veículos Line Hall Shopee
          </CardTitle>
          <p className="text-muted-foreground">
            {vehicles.length} veículos para cadastro com suas respectivas placas e cartões de abastecimento.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isRegistering && registrationResults.length === 0 && (
            <div className="text-center">
              <Button onClick={startRegistration} size="lg" className="w-full">
                Iniciar Cadastro em Lote
              </Button>
            </div>
          )}

          {isRegistering && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Cadastrando veículo {currentIndex} de {vehicles.length}
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="w-full" />
              {currentIndex > 0 && currentIndex <= vehicles.length && (
                <p className="text-sm text-muted-foreground">
                  Processando: {vehicles[currentIndex - 1].plate} - {vehicles[currentIndex - 1].model}
                </p>
              )}
            </div>
          )}

          {registrationResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resultados do Cadastro</h3>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {registrationResults.map((result, index) => (
                  <div
                    key={result.plate}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {result.status === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : result.status === 'error' ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      )}
                      <div>
                        <p className="font-medium">{result.plate}</p>
                        <p className="text-sm text-muted-foreground">
                          {vehicles.find(v => v.plate === result.plate)?.model}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm ${
                        result.status === 'success' ? 'text-green-600' : 
                        result.status === 'error' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {result.status === 'success' ? 'Sucesso' : 
                         result.status === 'error' ? 'Erro' : 'Processando'}
                      </p>
                      {result.message && (
                        <p className="text-xs text-muted-foreground">
                          {result.message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {!isRegistering && (
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {registrationResults.filter(r => r.status === 'success').length}
                      </p>
                      <p className="text-sm text-green-600">Sucessos</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">
                        {registrationResults.filter(r => r.status === 'error').length}
                      </p>
                      <p className="text-sm text-red-600">Erros</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => {
                      setRegistrationResults([]);
                      setCurrentIndex(0);
                    }}
                    variant="outline" 
                    className="w-full mt-4"
                  >
                    Reiniciar Cadastro
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}