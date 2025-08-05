import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { initializeTimezoneUrlFix } from "@/utils/externalTimezone";
import { initializeBrazilTimezone } from '@/utils/timezone-brazil';

// Inicializar timezone brasileiro na inicialização do app
// Executar após o carregamento do componente para evitar conflitos
setTimeout(() => {
  initializeBrazilTimezone();
}, 100);
import NotFound from "@/pages/not-found";
import WorkshopExternal from "@/pages/workshop-external";
import DashboardNew from "@/pages/DashboardNew";
import Dashboard from "@/pages/index";
import ExecutiveDashboard from "@/pages/ExecutiveDashboard";
import PainelOperacional from "@/pages/PainelOperacional";
import VehiclesNew from "@/pages/VehiclesNew";
import MaintenanceNew from "@/pages/MaintenanceNew";
import TiresPage from "@/pages/TiresPage";
import TireDetailPage from "@/pages/TireDetailPage";
import SolicitacoesPneus from "@/pages/pneus/SolicitacoesPneus";
import RefuelingNew from "@/pages/RefuelingNew";
import FinesNew from "@/pages/FinesNew";
// EntradaOperacoes removido (LineHall)
import UsersNew from "@/pages/UsersNew";
import Bases from "@/pages/Bases";
import SignIn from "@/pages/SignIn";
import RegisterNew from "@/pages/RegisterNew";
import LoginWithSupabase from "@/pages/LoginWithSupabase";
import RegisterWithSupabase from "@/pages/RegisterWithSupabase";
import AccessDeniedPage from "@/pages/access-denied";
//import TowingPartnersPage from "@/pages/TowingPartnersPage";
import TowingPartnersPage from "@/pages/fleet-management/towing-partners";
import TowingPartnerDetailPage from "@/pages/fleet-management/towing-partners/[id]";
import EditableTowingPartnerDetailPage from "@/pages/fleet-management/towing-partners/EditableTowingPartnerDetailPage";
import NewTowingPartnerPage from "@/pages/fleet-management/towing-partners/new";
import TowingRequestsPage from "@/pages/fleet-management/towing-partners/requests";
import NewTowingRequestPage from "@/pages/fleet-management/towing-partners/requests/new";
import FordPartnerDetail from "@/pages/fleet-management/towing-partners/FordPartnerDetail";
import TowingPartnerExternalAccess from "@/pages/fleet-management/towing-partners/external-access/[token]";
import TowingPaymentsPage from "@/pages/fleet-management/towing-partners/payments";
import ServicosPendentesPage from "@/pages/fleet-management/towing-partners/servicos-pendentes";
import FinanceiroGuincho from "@/pages/fleet-management/towing-partners/financeiro";
import TimezoneTest from "@/pages/timezone-test";
import { ProtectedRoute } from "@/components/permission/ProtectedRoute";
import ProtectedBaseRoute from "@/components/ProtectedBaseRoute";
// LineHallRedirect removido conforme solicitação
import FleetManagementRedirect from "@/components/permission/FleetManagementRedirect";
import { AuthProvider } from "@/context/AuthContext";
import { SupabaseAuthProvider } from "@/context/SupabaseAuthContext";
// Importação do hook para injetar token JWT em todas as requisições
import { useFetchWithAuth } from "@/hooks/useFetchWithAuth";

// Importação das páginas de postos
import IndexPostos from "@/pages/postos/IndexPostos";
import PostoOsasco from "@/pages/postos/Osasco";
import PostoOsascoV2 from "@/pages/postos/OsascoV2";
import PostoGuarulhos from "@/pages/postos/Guarulhos";
import PostoAlairV2 from "@/pages/postos/AlairV2";
import PostoGuarulhosV2 from "@/pages/postos/GuarulhosV2";
import PostoSaoPaulo from "@/pages/postos/SaoPaulo";
import ConsumoDiarioPorDia from "@/pages/postos/ConsumoDiarioPorDia";
import PostoCampinas from "@/pages/postos/Campinas";
import PostoCampinasV2 from "@/pages/postos/CampinasV2";
import PostoABC from "@/pages/postos/ABC";
import PostoABCV2 from "@/pages/postos/ABCV2";
import PostoSocorro from "@/pages/postos/Socorro";
import PostoSocorroV2 from "@/pages/postos/SocorroV2";
import PostoSorocaba from "@/pages/postos/Sorocaba";
import PostoSorocabaV2 from "@/pages/postos/SorocabaV2";
import HistoricoGeralPage from "@/pages/postos/HistoricoGeralPage";
import HistoricoPatioPage from "@/pages/postos/HistoricoPatioPage";
import LineHaulPage from "@/pages/LineHaulPage";
import HistoricoConsolidado from "@/pages/postos/HistoricoConsolidado";
import PostosVisaoGeralIntegrada from "@/pages/postos/PostosVisaoGeralIntegrada";
import PostoDetalhesPage from "@/pages/postos/PostoDetalhesPage";
import EntradaCombustivelPage from "@/pages/postos/EntradaCombustivelPage";
import SupabaseDiagnostico from "@/pages/diagnostico/SupabaseDiagnosticoSimples";
import SupabaseConsole from "@/pages/diagnostico/SupabaseConsole";
import ComparacaoEsquemas from "@/pages/diagnostico/ComparacaoEsquemas";
import SincronizarTabelasPage from "@/pages/diagnostico/sincronizar-tabelas";
import ApiTester from "@/pages/diagnostico/ApiTester";
import BudgetAttachmentsMigration from "@/pages/diagnostico/BudgetAttachmentsMigration";
import MigracaoAnexosPage from "@/pages/diagnostico/MigracaoAnexosPage";
import UploadDocumentoPage from "@/pages/diagnostico/UploadDocumentoPage";
import AutoSaveDemo from "@/pages/diagnostico/AutoSaveDemo";
import AutenticacaoDiagnostico from "@/pages/diagnostico/AutenticacaoDiagnostico";
import AdminUtils from "@/pages/AdminUtils";
import LimparDados from "@/pages/LimparDados";
import FuelReceiptsPage from "@/pages/fuel-receipts";

// Importação das novas páginas
import FleetManagement from "@/pages/fleet-management";
import Accidents from "@/pages/accidents";
import WorkSafety from "@/pages/work-safety";
import WorkshopsPage from "@/pages/fleet-management/WorkshopsPage";
import MaintenancePage from "@/pages/fleet-management/MaintenancePage";
import MaintenanceManagement from "@/pages/fleet-management/maintenance-management";
import BudgetManagementPage from "@/pages/fleet-management/BudgetManagementPage";
import InventoryPage from "@/pages/fleet-management/InventoryPage";
import PartsInventoryPage from "@/pages/fleet-management/parts-inventory";
import TiresEntrada from "@/pages/TiresEntrada";
import LineHallShopeePage from "@/pages/LineHallShopeePage";
import LineHallDriverPage from "@/pages/LineHallDriverPage";
import LineHallMaintenanceManager from "@/pages/LineHallMaintenanceManager";
import MotoristaLineHall from "@/pages/MotoristaLineHall";
import LineHallChecklistManager from "@/pages/LineHallChecklistManager";
import FuelCardPage from "@/pages/FuelCardPage";
import FuelCard from "@/pages/FuelCard";
import FuelCardRequestsPanel from "@/pages/FuelCardRequestsPanel";
import FuelCardSolicitation from "@/pages/fuel-card/solicitation";
import FuelCardConfirmation from "@/pages/fuel-card/confirmation";
import FuelCardDashboard from "@/pages/fuel-card/dashboard";
import StationProfile from "@/pages/fuel-card/station-profile";
import PostoRemediosPage from "@/pages/PostoRemediosPage";
import PostoRemediosStandalone from "@/pages/PostoRemediosStandalone";
import AbastecimentoPostoRemediosPage from "@/pages/AbastecimentoPostoRemediosPage";
import ProfileWithSupabase from "@/pages/ProfileWithSupabase";
import DriverChecklist from "@/pages/DriverChecklist";
import DriversPage from "@/pages/DriversPage";
import ManutencaoPage from "@/pages/ManutencaoPage";
import TratativaManutencaoPage from "@/pages/TratativaManutencaoPage";
import OficinasExternaPage from "@/pages/OficinasExternaPage";
import ConferenciaRotas from "@/pages/ConferenciaRotas";
import OficinaDashboard from "@/pages/oficina/OficinaDashboard";
import OficinaLogin from "@/pages/oficina/OficinaLogin";
import CarReception from "@/pages/oficina/CarReception";
import OficinaExternalDashboard from "@/pages/oficina/OficinaExternalDashboard";
import OficinasCredentialsPage from "@/pages/maintenance/oficinas-credentials";
import WorkshopExternalAccess from "@/pages/maintenance/workshop-external-access";
import CadastroOficina from "@/pages/maintenance/CadastroOficina";
import OficinaMurici from "@/pages/OficinaMurici";
import OficinaAlairEstoque from "@/pages/OficinaAlairEstoque";
import BaseRequests from "@/pages/BaseRequests";
import CartaoAbastecimentoPage from "@/pages/CartaoAbastecimentoPage";
import PainelPostosPage from "@/pages/PainelPostosPage";
import AbastecimentosPage from "@/pages/AbastecimentosPage";
import StoppedVehicles from "@/pages/StoppedVehicles";
import DriverAccess from "@/pages/DriverAccess";
import DriverMaintenanceRequest from "@/pages/DriverMaintenanceRequest";
import LineHallVehicleRegistration from "@/pages/LineHallVehicleRegistration";
import LineHallFuelCardRequests from "@/pages/LineHallFuelCardRequests";
import Equipment from "@/pages/Equipment";
import CoordinatorManagement from "@/pages/CoordinatorManagement";
import TestMaintenancePlates from "@/pages/TestMaintenancePlates";
import TestLoginBase from "@/pages/TestLoginBase";

// Importação das páginas de Abastecimento Terceiros
import AbastecimentoTerceirosLogin from "@/pages/AbastecimentoTerceirosLogin";
import AbastecimentoTerceirosDashboard from "@/pages/AbastecimentoTerceirosDashboard";
import GerenciamentoTerceiros from "@/pages/GerenciamentoTerceiros";

// Importação das páginas da Base Campinas
import LoginCampinas from "@/pages/bases/LoginCampinas";
import BaseCampinas from "@/pages/bases/BaseCampinas";
import DespesasCampinas from "@/pages/bases/DespesasCampinas";
import MultasCampinas from "@/pages/bases/MultasCampinas";
import AcidentesTrabalho from "@/pages/bases/AcidentesTrabalho";
import SinistrosCampinas from "@/pages/bases/SinistrosCampinas";
import SolicitacaoPneusCampinas from "@/pages/bases/SolicitacaoPneusCampinas";
import SolicitacaoOrcamentoCampinas from "@/pages/bases/SolicitacaoOrcamentoCampinas";
import ManutencaoFrotaCampinas from "@/pages/bases/ManutencaoFrotaCampinas";
import CartaoCombustivelCampinas from "@/pages/bases/CartaoCombustivelCampinas";
import CartaoCombustivelCampinasExterno from "@/pages/bases/external/CartaoCombustivelCampinasExterno";
import CartaoCombustivelGoiania from "@/pages/bases/CartaoCombustivelGoiania";
import CartaoCombustivelAlair from "@/pages/bases/CartaoCombustivelAlair";
import CartaoCombustivelGoianiaExterno from "@/pages/bases/external/CartaoCombustivelGoianiaExterno";
import CartaoCombustivelAlairExterno from "@/pages/bases/external/CartaoCombustivelAlairExterno";

// Importação das páginas da Base Goiânia
import BaseGoiania from "@/pages/bases/BaseGoiania";
import LoginGoiania from "@/pages/bases/LoginGoiania";

// Importação das páginas da Base Alair
import BaseAlair from "@/pages/bases/BaseAlair";
import LoginAlair from "@/pages/bases/LoginAlair";

// Importação das páginas da Base Salvador
import BaseSalvador from "@/pages/bases/BaseSalvador";
import LoginSalvador from "@/pages/bases/LoginSalvador";
import CartaoCombustivelSalvador from "@/pages/bases/CartaoCombustivelSalvador";

// Importação das páginas da Base SC (Ribeirão Preto) SSP4
import BaseSC from "@/pages/bases/BaseSC";
import LoginSC from "@/pages/bases/LoginSC";
import SinistrosSC from "@/pages/bases/SinistrosSC";
import AcidentesTrabalhoSC from "@/pages/bases/AcidentesTrabalhoSC";
import CartaoCombustivelSC from "@/pages/bases/CartaoCombustivelSC";
import MultasSC from "@/pages/bases/MultasSC";

// Importação de TODAS as 64 bases SC geradas automaticamente
import BaseAbc from "@/pages/bases/BaseAbc";
import LoginAbc from "@/pages/bases/LoginAbc";
import BaseAracatuba from "@/pages/bases/BaseAracatuba";
import LoginAracatuba from "@/pages/bases/LoginAracatuba";
import BaseArenaBarueri from "@/pages/bases/BaseArenaBarueri";
import LoginArenaBarueri from "@/pages/bases/LoginArenaBarueri";
import BaseAtibaia from "@/pages/bases/BaseAtibaia";
import LoginAtibaia from "@/pages/bases/LoginAtibaia";
import BaseAvare from "@/pages/bases/BaseAvare";
import LoginAvare from "@/pages/bases/LoginAvare";
import BaseBahiaSalvador from "@/pages/bases/BaseBahiaSalvador";
import LoginBahiaSalvador from "@/pages/bases/LoginBahiaSalvador";
import BaseBauru from "@/pages/bases/BaseBauru";
import LoginBauru from "@/pages/bases/LoginBauru";
import BaseBlumenau from "@/pages/bases/BaseBlumenau";
import LoginBlumenau from "@/pages/bases/LoginBlumenau";
import BaseBrasilia from "@/pages/bases/BaseBrasilia";
import LoginBrasilia from "@/pages/bases/LoginBrasilia";
import BaseCampinaGrandeSul from "@/pages/bases/BaseCampinaGrandeSul";
import LoginCampinaGrandeSul from "@/pages/bases/LoginCampinaGrandeSul";
import BaseCampinasS3 from "@/pages/bases/BaseCampinasS3";
import LoginCampinasS3 from "@/pages/bases/LoginCampinasS3";
import BaseCampinasS7 from "@/pages/bases/BaseCampinasS7";
import LoginCampinasS7 from "@/pages/bases/LoginCampinasS7";
import BaseCampoGrande from "@/pages/bases/BaseCampoGrande";
import LoginCampoGrande from "@/pages/bases/LoginCampoGrande";
import BaseCaraguatatuba from "@/pages/bases/BaseCaraguatatuba";
import LoginCaraguatatuba from "@/pages/bases/LoginCaraguatatuba";
import BaseCascavel from "@/pages/bases/BaseCascavel";
import LoginCascavel from "@/pages/bases/LoginCascavel";
import BaseChapeco from "@/pages/bases/BaseChapeco";
import LoginChapeco from "@/pages/bases/LoginChapeco";
import BaseContagem from "@/pages/bases/BaseContagem";
import LoginContagem from "@/pages/bases/LoginContagem";
import BaseCotia from "@/pages/bases/BaseCotia";
import LoginCotia from "@/pages/bases/LoginCotia";
import BaseCriciuma from "@/pages/bases/BaseCriciuma";
import LoginCriciuma from "@/pages/bases/LoginCriciuma";
import BaseCuiaba from "@/pages/bases/BaseCuiaba";
import LoginCuiaba from "@/pages/bases/LoginCuiaba";
import BaseCuritiba from "@/pages/bases/BaseCuritiba";
import LoginCuritiba from "@/pages/bases/LoginCuritiba";
import BaseDivinopolis from "@/pages/bases/BaseDivinopolis";
import LoginDivinopolis from "@/pages/bases/LoginDivinopolis";
import BaseFlorianopolis from "@/pages/bases/BaseFlorianopolis";
import LoginFlorianopolis from "@/pages/bases/LoginFlorianopolis";
import BaseFortaleza from "@/pages/bases/BaseFortaleza";
import LoginFortaleza from "@/pages/bases/LoginFortaleza";
import BaseFranca from "@/pages/bases/BaseFranca";
import LoginFranca from "@/pages/bases/LoginFranca";
import BaseFullFilmente from "@/pages/bases/BaseFullFilmente";
import LoginFullFilmente from "@/pages/bases/LoginFullFilmente";
import BaseGuarapuava from "@/pages/bases/BaseGuarapuava";
import LoginGuarapuava from "@/pages/bases/LoginGuarapuava";
import BaseItapetininga from "@/pages/bases/BaseItapetininga";
import LoginItapetininga from "@/pages/bases/LoginItapetininga";
import BaseItaquera from "@/pages/bases/BaseItaquera";
import LoginItaquera from "@/pages/bases/LoginItaquera";
import BaseItupeva from "@/pages/bases/BaseItupeva";
import LoginItupeva from "@/pages/bases/LoginItupeva";
import BaseJales from "@/pages/bases/BaseJales";
import LoginJales from "@/pages/bases/LoginJales";
import BaseJoinville from "@/pages/bases/BaseJoinville";
import LoginJoinville from "@/pages/bases/LoginJoinville";
import BaseLajeado from "@/pages/bases/BaseLajeado";
import LoginLajeado from "@/pages/bases/LoginLajeado";
import BaseLondrina from "@/pages/bases/BaseLondrina";
import LoginLondrina from "@/pages/bases/LoginLondrina";
import BaseManaus from "@/pages/bases/BaseManaus";
import LoginManaus from "@/pages/bases/LoginManaus";
import BaseMarilia from "@/pages/bases/BaseMarilia";
import LoginMarilia from "@/pages/bases/LoginMarilia";
import BaseMaringa from "@/pages/bases/BaseMaringa";
import LoginMaringa from "@/pages/bases/LoginMaringa";
import BaseMegaGuarulhos from "@/pages/bases/BaseMegaGuarulhos";
import LoginMegaGuarulhos from "@/pages/bases/LoginMegaGuarulhos";
import BaseMogiCruzes from "@/pages/bases/BaseMogiCruzes";
import LoginMogiCruzes from "@/pages/bases/LoginMogiCruzes";
import BaseMoocaCentro from "@/pages/bases/BaseMoocaCentro";
import LoginMoocaCentro from "@/pages/bases/LoginMoocaCentro";
import BasePassoFundo from "@/pages/bases/BasePassoFundo";
import LoginPassoFundo from "@/pages/bases/LoginPassoFundo";
import BasePatoBranco from "@/pages/bases/BasePatoBranco";
import LoginPatoBranco from "@/pages/bases/LoginPatoBranco";
import BasePatosMinas from "@/pages/bases/BasePatosMinas";
import LoginPatosMinas from "@/pages/bases/LoginPatosMinas";
import BasePelotas from "@/pages/bases/BasePelotas";
import LoginPelotas from "@/pages/bases/LoginPelotas";
import BasePiracicaba from "@/pages/bases/BasePiracicaba";
import LoginPiracicaba from "@/pages/bases/LoginPiracicaba";
import BasePocosCaldas from "@/pages/bases/BasePocosCaldas";
import LoginPocosCaldas from "@/pages/bases/LoginPocosCaldas";
import BasePontaGrossa from "@/pages/bases/BasePontaGrossa";
import LoginPontaGrossa from "@/pages/bases/LoginPontaGrossa";
import BasePortoAlegre from "@/pages/bases/BasePortoAlegre";
import LoginPortoAlegre from "@/pages/bases/LoginPortoAlegre";
import BasePqNovoMundo from "@/pages/bases/BasePqNovoMundo";
import LoginPqNovoMundo from "@/pages/bases/LoginPqNovoMundo";
import BasePresidentePrudente from "@/pages/bases/BasePresidentePrudente";
import LoginPresidentePrudente from "@/pages/bases/LoginPresidentePrudente";
import BaseQueimados from "@/pages/bases/BaseQueimados";
import LoginQueimados from "@/pages/bases/LoginQueimados";
import BaseRecife from "@/pages/bases/BaseRecife";
import LoginRecife from "@/pages/bases/LoginRecife";
import BaseSantaMaria from "@/pages/bases/BaseSantaMaria";
import LoginSantaMaria from "@/pages/bases/LoginSantaMaria";
import BaseSantos from "@/pages/bases/BaseSantos";
import LoginSantos from "@/pages/bases/LoginSantos";
import BaseSaoCarlos from "@/pages/bases/BaseSaoCarlos";
import LoginSaoCarlos from "@/pages/bases/LoginSaoCarlos";
import BaseSaoJoseCampos from "@/pages/bases/BaseSaoJoseCampos";
import LoginSaoJoseCampos from "@/pages/bases/LoginSaoJoseCampos";
import BaseSapucaia from "@/pages/bases/BaseSapucaia";
import LoginSapucaia from "@/pages/bases/LoginSapucaia";
import BaseSjRioPreto from "@/pages/bases/BaseSjRioPreto";
import LoginSjRioPreto from "@/pages/bases/LoginSjRioPreto";
import BaseSorocaba from "@/pages/bases/BaseSorocaba";
import LoginSorocaba from "@/pages/bases/LoginSorocaba";
import BaseVitoria from "@/pages/bases/BaseVitoria";
import LoginVitoria from "@/pages/bases/LoginVitoria";
import BaseZLeste from "@/pages/bases/BaseZLeste";
import LoginZLeste from "@/pages/bases/LoginZLeste";
import BaseZSul from "@/pages/bases/BaseZSul";
import LoginZSul from "@/pages/bases/LoginZSul";

// Importação do sistema genérico de bases
import BaseRouteHandler from "@/components/base/BaseRouteHandler";

// Importação das páginas públicas de postos
import OsascoPublic from "@/pages/postos/public/OsascoPublic";
import OsascoV2Public from "@/pages/postos/public/OsascoV2Public";
import GuarulhosPublic from "@/pages/postos/public/GuarulhosPublic";

// Importação das páginas de postos externos V2 (renomeadas para evitar conflitos)
import PostoABCV2External from "@/pages/postos-externos/PostoABCV2";
import PostoCampinasV2External from "@/pages/postos-externos/PostoCampinasV2";
import PostosExternosIndex from "@/pages/postos-externos/index";
import GuarulhosV2Public from "@/pages/postos/public/GuarulhosV2Public";
import AlairV2Public from "@/pages/postos/public/AlairV2Public";
import SaoPauloPublic from "@/pages/postos/public/SaoPauloPublic";
import CampinasPublic from "@/pages/postos/public/CampinasPublic";
import CampinasV2Public from "@/pages/postos/public/CampinasV2Public";
import ABCPublic from "@/pages/postos/public/ABCPublic";
import ABCV2Public from "@/pages/postos/public/ABCV2Public";
import SocorroPublic from "@/pages/postos/public/SocorroPublic";
import SocorroV2Public from "@/pages/postos/public/SocorroV2Public";
import SorocabaPublic from "@/pages/postos/public/SorocabaPublic";
import SorocabaV2Public from "@/pages/postos/public/SorocabaV2Public";

// Importação das páginas públicas do GRUPO PEREIRA
import PublicPostoGP01 from "@/pages/postos/PublicPostoGP01";
import PublicPostoGP02 from "@/pages/postos/PublicPostoGP02";
import PublicPostoGP03 from "@/pages/postos/PublicPostoGP03";

// Importação das páginas externas das bases GRUPO PEREIRA
import BaseGP01External from "@/pages/bases/BaseGP01External";
import BaseGP02External from "@/pages/bases/BaseGP02External";
import BaseGP03External from "@/pages/bases/BaseGP03External";
import BaseGP02 from "@/pages/bases/BaseGP02";
import BaseGP03 from "@/pages/bases/BaseGP03";
import LoginGP01 from "@/pages/bases/LoginGP01";
import LoginGP02 from "@/pages/bases/LoginGP02";
import LoginGP03 from "@/pages/bases/LoginGP03";
import CartaoCombustivelGP01 from "@/pages/bases/CartaoCombustivelGP01";
import CartaoCombustivelGP02 from "@/pages/bases/CartaoCombustivelGP02";
import CartaoCombustivelGP03 from "@/pages/bases/CartaoCombustivelGP03";
import DespesasGP03 from "@/pages/bases/DespesasGP03";
import MultasGP03 from "@/pages/bases/MultasGP03";
import SinistrosGP03 from "@/pages/bases/SinistrosGP03";
import AcidentesTrabalhoGP03 from "@/pages/bases/AcidentesTrabalhoGP03";
import SolicitacaoPneusGP03 from "@/pages/bases/SolicitacaoPneusGP03";
import SolicitacaoOrcamentoGP03 from "@/pages/bases/SolicitacaoOrcamentoGP03";
import ManutencaoFrotaGP03 from "@/pages/bases/ManutencaoFrotaGP03";
import CartoesAtivosGP02 from "@/pages/bases/CartoesAtivosGP02";
import CartoesAtivosGP03 from "@/pages/bases/CartoesAtivosGP03";

import RegisterPostoUser from "@/pages/postos/RegisterPostoUser";
import RedirectToPosto from "@/pages/RedirectToPosto";
import PostoAcessoDireto from "@/pages/PostoAcessoDireto";
import LinksExternosPostos from "@/pages/postos/LinksExternosPostos";
import LinksExternosBases from "@/pages/bases/LinksExternosBases";
import BasePublic from "@/pages/bases/BasePublic";
import PartnerLogin from "@/pages/partner-login";
import PartnerDashboard from "@/pages/partner-dashboard";
import FuelCardRedirect from "@/components/FuelCardRedirect";
import MaintenanceSystem from "@/pages/maintenance";
import TestLogout from "@/pages/TestLogout";
import TestCampinasLogin from "@/pages/TestCampinasLogin";
import TestOperatorSecurity from "@/pages/TestOperatorSecurity";
import TestMaintenanceData from "@/pages/TestMaintenanceData";

function App() {
  // Ativar o hook de injeção automática de token JWT em todas as requisições fetch
  useFetchWithAuth();
  
  // Inicializar correção automática de timezone em URLs
  useEffect(() => {
    initializeTimezoneUrlFix();
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <AuthProvider>
          <Switch>
            <Route path="/login">
              <SignIn />
            </Route>
            <Route path="/login-supabase">
              <LoginWithSupabase />
            </Route>
            
            {/* Rotas específicas de login para cada base */}
            <Route path="/bases/campinas/login">
              <LoginCampinas />
            </Route>
            <Route path="/bases/sc/login">
              <LoginSC />
            </Route>
            
            {/* Rotas de login para TODAS as 64 bases SC */}
            <Route path="/bases/abc/login">
              <LoginAbc />
            </Route>
            <Route path="/bases/aracatuba/login">
              <LoginAracatuba />
            </Route>
            <Route path="/bases/arena-barueri/login">
              <LoginArenaBarueri />
            </Route>
            <Route path="/bases/atibaia/login">
              <LoginAtibaia />
            </Route>
            <Route path="/bases/avare/login">
              <LoginAvare />
            </Route>
            <Route path="/bases/bahia-salvador/login">
              <LoginBahiaSalvador />
            </Route>
            <Route path="/bases/bauru/login">
              <LoginBauru />
            </Route>
            <Route path="/bases/blumenau/login">
              <LoginBlumenau />
            </Route>
            <Route path="/bases/brasilia/login">
              <LoginBrasilia />
            </Route>
            <Route path="/bases/campina-grande-sul/login">
              <LoginCampinaGrandeSul />
            </Route>
            <Route path="/bases/campinas-s3/login">
              <LoginCampinasS3 />
            </Route>
            <Route path="/bases/campinas-s7/login">
              <LoginCampinasS7 />
            </Route>
            <Route path="/bases/campo-grande/login">
              <LoginCampoGrande />
            </Route>
            <Route path="/bases/caraguatatuba/login">
              <LoginCaraguatatuba />
            </Route>
            <Route path="/bases/cascavel/login">
              <LoginCascavel />
            </Route>
            <Route path="/bases/chapeco/login">
              <LoginChapeco />
            </Route>
            <Route path="/bases/contagem/login">
              <LoginContagem />
            </Route>
            <Route path="/bases/cotia/login">
              <LoginCotia />
            </Route>
            <Route path="/bases/criciuma/login">
              <LoginCriciuma />
            </Route>
            <Route path="/bases/cuiaba/login">
              <LoginCuiaba />
            </Route>
            <Route path="/bases/curitiba/login">
              <LoginCuritiba />
            </Route>
            <Route path="/bases/divinopolis/login">
              <LoginDivinopolis />
            </Route>
            <Route path="/bases/florianopolis/login">
              <LoginFlorianopolis />
            </Route>
            <Route path="/bases/fortaleza/login">
              <LoginFortaleza />
            </Route>
            <Route path="/bases/franca/login">
              <LoginFranca />
            </Route>
            <Route path="/bases/full-filmente/login">
              <LoginFullFilmente />
            </Route>
            <Route path="/bases/goiania/login">
              <LoginGoiania />
            </Route>
            <Route path="/bases/guarapuava/login">
              <LoginGuarapuava />
            </Route>
            <Route path="/bases/itapetininga/login">
              <LoginItapetininga />
            </Route>
            <Route path="/bases/itaquera/login">
              <LoginItaquera />
            </Route>
            <Route path="/bases/itupeva/login">
              <LoginItupeva />
            </Route>
            <Route path="/bases/jales/login">
              <LoginJales />
            </Route>
            <Route path="/bases/joinville/login">
              <LoginJoinville />
            </Route>
            <Route path="/bases/lajeado/login">
              <LoginLajeado />
            </Route>
            <Route path="/bases/londrina/login">
              <LoginLondrina />
            </Route>
            <Route path="/bases/manaus/login">
              <LoginManaus />
            </Route>
            <Route path="/bases/marilia/login">
              <LoginMarilia />
            </Route>
            <Route path="/bases/maringa/login">
              <LoginMaringa />
            </Route>
            <Route path="/bases/mega-guarulhos/login">
              <LoginMegaGuarulhos />
            </Route>
            <Route path="/bases/mogi-cruzes/login">
              <LoginMogiCruzes />
            </Route>
            <Route path="/bases/mooca-centro/login">
              <LoginMoocaCentro />
            </Route>
            <Route path="/bases/passo-fundo/login">
              <LoginPassoFundo />
            </Route>
            <Route path="/bases/pato-branco/login">
              <LoginPatoBranco />
            </Route>
            <Route path="/bases/patos-minas/login">
              <LoginPatosMinas />
            </Route>
            <Route path="/bases/pelotas/login">
              <LoginPelotas />
            </Route>
            <Route path="/bases/piracicaba/login">
              <LoginPiracicaba />
            </Route>
            <Route path="/bases/pocos-caldas/login">
              <LoginPocosCaldas />
            </Route>
            <Route path="/bases/ponta-grossa/login">
              <LoginPontaGrossa />
            </Route>
            <Route path="/bases/porto-alegre/login">
              <LoginPortoAlegre />
            </Route>
            <Route path="/bases/pq-novo-mundo/login">
              <LoginPqNovoMundo />
            </Route>
            <Route path="/bases/presidente-prudente/login">
              <LoginPresidentePrudente />
            </Route>
            <Route path="/bases/queimados/login">
              <LoginQueimados />
            </Route>
            <Route path="/bases/recife/login">
              <LoginRecife />
            </Route>
            <Route path="/bases/santa-maria/login">
              <LoginSantaMaria />
            </Route>
            <Route path="/bases/santos/login">
              <LoginSantos />
            </Route>
            <Route path="/bases/sao-carlos/login">
              <LoginSaoCarlos />
            </Route>
            <Route path="/bases/sao-jose-campos/login">
              <LoginSaoJoseCampos />
            </Route>
            <Route path="/bases/sapucaia/login">
              <LoginSapucaia />
            </Route>
            <Route path="/bases/sj-rio-preto/login">
              <LoginSjRioPreto />
            </Route>
            <Route path="/bases/sorocaba/login">
              <LoginSorocaba />
            </Route>
            <Route path="/bases/vitoria/login">
              <LoginVitoria />
            </Route>
            <Route path="/bases/z-leste/login">
              <LoginZLeste />
            </Route>
            <Route path="/bases/z-sul/login">
              <LoginZSul />
            </Route>
            <Route path="/register">
              <RegisterNew />
            </Route>
            <Route path="/register-supabase">
              <RegisterWithSupabase />
            </Route>
            <Route path="/acesso-negado">
              <AccessDeniedPage />
            </Route>
            <Route path="/test-logout">
              <TestLogout />
            </Route>
            <Route path="/test-campinas-login">
              <TestCampinasLogin />
            </Route>
            <Route path="/test-timezone">
              <TimezoneTest />
            </Route>
            <Route path="/test-operator-security">
              <TestOperatorSecurity />
            </Route>
            <Route path="/test-maintenance-data">
              <TestMaintenanceData />
            </Route>
            <Route path="/test-maintenance-plates">
              <TestMaintenancePlates />
            </Route>
            
            {/* Componentes de redirecionamento para usuários específicos */}
            {/* Rota removida - antigas páginas LineHall */}
            <Route path="/old-dashboard">
              <Dashboard />
            </Route>
            
            <Route path="/fleet-redirect">
              <FleetManagementRedirect />
            </Route>
          
          {/* Novo Dashboard com KPIs */}
          <ProtectedRoute path="/" component={Dashboard} />
          <ProtectedRoute path="/executive-dashboard" component={ExecutiveDashboard} />
          <ProtectedRoute path="/painel-operacional" component={PainelOperacional} />
          
          {/* Rotas protegidas com verificação de permissão de base */}
          <ProtectedRoute path="/vehicles" component={VehiclesNew} />
          <ProtectedRoute path="/linehall-register" component={LineHallVehicleRegistration} />
          <ProtectedRoute path="/stopped-vehicles" component={StoppedVehicles} />
          {/* <ProtectedRoute path="/maintenance" component={MaintenanceNew} /> */}
          <ProtectedRoute path="/tires" component={TiresPage} />
          <ProtectedRoute path="/tires/entrada" component={TiresEntrada} />
          <ProtectedRoute path="/tires/solicitacoes" component={SolicitacoesPneus} />
          <ProtectedRoute path="/tires/:id" component={TireDetailPage} />
          <ProtectedRoute path="/refueling" component={RefuelingNew} />
          <ProtectedRoute path="/fines" component={FinesNew} />
          {/* Line Hall removido conforme solicitação */}
          <ProtectedRoute path="/fleet-management" component={FleetManagement} />
          <ProtectedRoute path="/fleet-management/inventory" component={InventoryPage} />
          <ProtectedRoute path="/fleet-management/parts-inventory" component={PartsInventoryPage} />
          <ProtectedRoute path="/fleet-management/workshops" component={WorkshopsPage} />
          <ProtectedRoute path="/fleet-management/maintenance" component={MaintenanceManagement} />
          <ProtectedRoute path="/fleet-management/maintenance-management" component={MaintenanceManagement} />
          <ProtectedRoute path="/fleet-management/budgets" component={BudgetManagementPage} />
          <ProtectedRoute path="/equipment" component={Equipment} />
          <ProtectedRoute path="/fleet-management/towing-partners" component={TowingPartnersPage} />
          <ProtectedRoute path="/fleet-management/towing-partners/new" component={NewTowingPartnerPage} />
          <ProtectedRoute path="/fleet-management/towing-partners/requests" component={TowingRequestsPage} />
          <ProtectedRoute path="/fleet-management/towing-partners/requests/new" component={NewTowingRequestPage} />
          <ProtectedRoute path="/fleet-management/towing-partners/servicos-pendentes" component={ServicosPendentesPage} />
          <ProtectedRoute path="/fleet-management/towing-partners/financeiro" component={FinanceiroGuincho} />
          <ProtectedRoute path="/fleet-management/towing-partners-payments" component={TowingPaymentsPage} />
          <Route path="/fleet-management/towing-partners/external-access/:token" component={TowingPartnerExternalAccess} />
          <ProtectedRoute path="/fleet-management/towing-partners/6" component={FordPartnerDetail} />
          <ProtectedRoute path="/fleet-management/towing-partners/:id" component={EditableTowingPartnerDetailPage} />
          <ProtectedRoute path="/accidents" component={Accidents} />
          <ProtectedRoute path="/fuel-receipts" component={FuelReceiptsPage} />
          <ProtectedRoute path="/work-safety" component={WorkSafety} />
          <ProtectedRoute path="/conferencia-rotas" component={ConferenciaRotas} />
          <ProtectedRoute path="/line-haul" component={LineHaulPage} />
          <ProtectedRoute path="/users" component={UsersNew} />
          <ProtectedRoute path="/bases" component={Bases} />
          <ProtectedRoute path="/bases/links-externos" component={LinksExternosBases} />
          <ProtectedRoute path="/bases/campinas" component={BaseCampinas} />
          <ProtectedRoute path="/bases/campinas/despesas" component={DespesasCampinas} />
          <ProtectedRoute path="/bases/campinas/multas" component={MultasCampinas} />
          <ProtectedRoute path="/bases/campinas/acidentes-trabalho" component={AcidentesTrabalho} />
          <ProtectedRoute path="/bases/campinas/sinistros" component={SinistrosCampinas} />
          <ProtectedRoute path="/bases/campinas/solicitacao-pneus" component={SolicitacaoPneusCampinas} />
          <ProtectedRoute path="/bases/campinas/solicitacao-orcamento" component={SolicitacaoOrcamentoCampinas} />
          <ProtectedRoute path="/bases/campinas/manutencao-frota" component={ManutencaoFrotaCampinas} />
          <ProtectedRoute path="/bases/campinas/cartao-combustivel" component={CartaoCombustivelCampinas} />
          
          {/* Rotas externas públicas - Base Campinas */}
          <Route path="/bases/campinas/external/cartao-combustivel" component={CartaoCombustivelCampinasExterno} />
          <Route path="/posto/campinas/externo" component={CartaoCombustivelCampinasExterno} />
          
          {/* Rotas externas públicas - Base Goiânia */}
          <Route path="/bases/goiania/external/cartao-combustivel" component={CartaoCombustivelGoianiaExterno} />
          <Route path="/posto/goiania/externo" component={CartaoCombustivelGoianiaExterno} />
          
          {/* Rotas externas públicas - Base Alair */}
          <Route path="/bases/alair/external/cartao-combustivel" component={CartaoCombustivelAlairExterno} />
          <Route path="/posto/alair/externo" component={CartaoCombustivelAlairExterno} />
          
          {/* Rotas públicas para bases - acesso externo */}
          <Route path="/base/:id/:slug/public" component={BasePublic} />
          <Route path="/base/:id/public" component={BasePublic} />
          
          {/* Rotas para a Base Goiânia */}
          <ProtectedRoute path="/bases/goiania" component={BaseGoiania} />
          <ProtectedRoute path="/bases/57" component={BaseGoiania} />
          <ProtectedRoute path="/bases/goiania/cartao-combustivel" component={CartaoCombustivelGoiania} />
          <ProtectedRoute path="/bases/57/cartao-combustivel" component={CartaoCombustivelGoiania} />
          <Route path="/bases/goiania/login" component={LoginGoiania} />
          <Route path="/bases/57/login" component={LoginGoiania} />
          
          {/* Rotas para a Base Alair */}
          <ProtectedRoute path="/bases/alair" component={BaseAlair} />
          <ProtectedRoute path="/bases/76" component={BaseAlair} />
          <ProtectedRoute path="/bases/alair/cartao-combustivel" component={CartaoCombustivelAlair} />
          <ProtectedRoute path="/bases/76/cartao-combustivel" component={CartaoCombustivelAlair} />
          <Route path="/bases/alair/login" component={LoginAlair} />
          <Route path="/bases/76/login" component={LoginAlair} />
          
          {/* Rotas para a Base SC (Ribeirão Preto) SSP4 */}
          <ProtectedRoute path="/bases/sc" component={BaseSC} />
          <ProtectedRoute path="/bases/sc/sinistros" component={SinistrosSC} />
          <ProtectedRoute path="/bases/sc/acidentes-trabalho" component={AcidentesTrabalhoSC} />
          <ProtectedRoute path="/bases/sc/multas" component={MultasSC} />
          <ProtectedRoute path="/bases/sc/cartao-combustivel" component={CartaoCombustivelSC} />
          <Route path="/bases/sc/login" component={LoginSC} />

          {/* Rotas para TODAS as 64 bases SC */}
          <ProtectedRoute path="/bases/abc" component={BaseAbc} />
          <ProtectedRoute path="/bases/aracatuba" component={BaseAracatuba} />
          <ProtectedRoute path="/bases/arena-barueri" component={BaseArenaBarueri} />
          <ProtectedRoute path="/bases/atibaia" component={BaseAtibaia} />
          <ProtectedRoute path="/bases/avare" component={BaseAvare} />
          <ProtectedRoute path="/bases/bahia-salvador" component={BaseBahiaSalvador} />
          <ProtectedRoute path="/bases/bauru" component={BaseBauru} />
          <ProtectedRoute path="/bases/blumenau" component={BaseBlumenau} />
          <ProtectedRoute path="/bases/brasilia" component={BaseBrasilia} />
          <ProtectedRoute path="/bases/campina-grande-sul" component={BaseCampinaGrandeSul} />
          <ProtectedRoute path="/bases/campinas-s3" component={BaseCampinasS3} />
          <ProtectedRoute path="/bases/campinas-s7" component={BaseCampinasS7} />
          <ProtectedRoute path="/bases/campo-grande" component={BaseCampoGrande} />
          <ProtectedRoute path="/bases/caraguatatuba" component={BaseCaraguatatuba} />
          <ProtectedRoute path="/bases/cascavel" component={BaseCascavel} />
          <ProtectedRoute path="/bases/chapeco" component={BaseChapeco} />
          <ProtectedRoute path="/bases/contagem" component={BaseContagem} />
          <ProtectedRoute path="/bases/cotia" component={BaseCotia} />
          <ProtectedRoute path="/bases/criciuma" component={BaseCriciuma} />
          <ProtectedRoute path="/bases/cuiaba" component={BaseCuiaba} />
          <ProtectedRoute path="/bases/curitiba" component={BaseCuritiba} />
          <ProtectedRoute path="/bases/divinopolis" component={BaseDivinopolis} />
          <ProtectedRoute path="/bases/florianopolis" component={BaseFlorianopolis} />
          <ProtectedRoute path="/bases/fortaleza" component={BaseFortaleza} />
          <ProtectedRoute path="/bases/franca" component={BaseFranca} />
          <ProtectedRoute path="/bases/full-filmente" component={BaseFullFilmente} />
          <ProtectedRoute path="/bases/guarapuava" component={BaseGuarapuava} />
          <ProtectedRoute path="/bases/itapetininga" component={BaseItapetininga} />
          <ProtectedRoute path="/bases/itaquera" component={BaseItaquera} />
          <ProtectedRoute path="/bases/itupeva" component={BaseItupeva} />
          <ProtectedRoute path="/bases/jales" component={BaseJales} />
          <ProtectedRoute path="/bases/joinville" component={BaseJoinville} />
          <ProtectedRoute path="/bases/lajeado" component={BaseLajeado} />
          <ProtectedRoute path="/bases/londrina" component={BaseLondrina} />
          <ProtectedRoute path="/bases/manaus" component={BaseManaus} />
          <ProtectedRoute path="/bases/marilia" component={BaseMarilia} />
          <ProtectedRoute path="/bases/maringa" component={BaseMaringa} />
          <ProtectedRoute path="/bases/mega-guarulhos" component={BaseMegaGuarulhos} />
          <ProtectedRoute path="/bases/mogi-cruzes" component={BaseMogiCruzes} />
          <ProtectedRoute path="/bases/mooca-centro" component={BaseMoocaCentro} />
          <ProtectedRoute path="/bases/passo-fundo" component={BasePassoFundo} />
          <ProtectedRoute path="/bases/pato-branco" component={BasePatoBranco} />
          <ProtectedRoute path="/bases/patos-minas" component={BasePatosMinas} />
          <ProtectedRoute path="/bases/pelotas" component={BasePelotas} />
          <ProtectedRoute path="/bases/piracicaba" component={BasePiracicaba} />
          <ProtectedRoute path="/bases/pocos-caldas" component={BasePocosCaldas} />
          <ProtectedRoute path="/bases/ponta-grossa" component={BasePontaGrossa} />
          <ProtectedRoute path="/bases/porto-alegre" component={BasePortoAlegre} />
          <ProtectedRoute path="/bases/pq-novo-mundo" component={BasePqNovoMundo} />
          <ProtectedRoute path="/bases/presidente-prudente" component={BasePresidentePrudente} />
          <ProtectedRoute path="/bases/queimados" component={BaseQueimados} />
          <ProtectedRoute path="/bases/recife" component={BaseRecife} />
          <ProtectedRoute path="/bases/santa-maria" component={BaseSantaMaria} />
          <ProtectedRoute path="/bases/santos" component={BaseSantos} />
          <ProtectedRoute path="/bases/sao-carlos" component={BaseSaoCarlos} />
          <ProtectedRoute path="/bases/sao-jose-campos" component={BaseSaoJoseCampos} />
          <ProtectedRoute path="/bases/sapucaia" component={BaseSapucaia} />
          <ProtectedRoute path="/bases/sj-rio-preto" component={BaseSjRioPreto} />
          <ProtectedRoute path="/bases/sorocaba" component={BaseSorocaba} />
          <ProtectedRoute path="/bases/vitoria" component={BaseVitoria} />
          <ProtectedRoute path="/bases/z-leste" component={BaseZLeste} />
          <ProtectedRoute path="/bases/z-sul" component={BaseZSul} />
          
          {/* Rotas para a Base Salvador */}
          <ProtectedRoute path="/bases/salvador" component={BaseSalvador} />
          <ProtectedRoute path="/bases/58" component={BaseSalvador} />
          <ProtectedRoute path="/bases/salvador/cartao-combustivel" component={CartaoCombustivelSalvador} />
          <ProtectedRoute path="/bases/58/cartao-combustivel" component={CartaoCombustivelSalvador} />
          <Route path="/bases/salvador/login" component={LoginSalvador} />
          <Route path="/bases/58/login" component={LoginSalvador} />
          
          {/* Redirecionamentos para rotas antigas do GP03 */}
          <Route path="/gp03/login">
            {() => {
              window.location.href = '/bases/gp03/login';
              return null;
            }}
          </Route>
          
          {/* Rotas de login para as bases GRUPO PEREIRA - DEVEM VIR ANTES DAS ROTAS GENÉRICAS */}
          <Route path="/bases/gp01/login">
            <LoginGP01 />
          </Route>
          <Route path="/bases/gp02/login">
            <LoginGP02 />
          </Route>
          <Route path="/bases/gp03/login">
            <LoginGP03 />
          </Route>
          
          {/* Rotas externas protegidas para as bases GRUPO PEREIRA */}
          <ProtectedRoute path="/bases/gp01/external" component={BaseGP01External} />
          <ProtectedRoute path="/bases/gp02/external" component={BaseGP02External} />
          <ProtectedRoute path="/bases/gp03/external" component={BaseGP03External} />
          
          {/* Rotas completas para Base GP02 (seguindo padrão da Base Campinas) - DEVE VIR ANTES DAS GENÉRICAS */}
          <ProtectedRoute path="/bases/gp02" component={BaseGP02} />
          <ProtectedRoute path="/bases/gp02/despesas" component={DespesasGP03} />
          <ProtectedRoute path="/bases/gp02/multas" component={MultasGP03} />
          <ProtectedRoute path="/bases/gp02/sinistros" component={SinistrosGP03} />
          <ProtectedRoute path="/bases/gp02/acidentes-trabalho" component={AcidentesTrabalhoGP03} />
          <ProtectedRoute path="/bases/gp02/solicitacao-pneus" component={SolicitacaoPneusGP03} />
          <ProtectedRoute path="/bases/gp02/solicitacao-orcamento" component={SolicitacaoOrcamentoGP03} />
          <ProtectedRoute path="/bases/gp02/manutencao-frota" component={ManutencaoFrotaGP03} />
          <ProtectedRoute path="/bases/gp02/cartoes-ativos" component={CartoesAtivosGP02} />
          
          {/* Rotas completas para Base GP03 (seguindo padrão da Base Campinas) - DEVE VIR ANTES DAS GENÉRICAS */}
          <ProtectedBaseRoute path="/bases/gp03" component={BaseGP03} baseLoginPath="/bases/gp03/login" baseName="GP03" />
          <ProtectedRoute path="/bases/gp03/despesas" component={DespesasGP03} />
          <ProtectedRoute path="/bases/gp03/multas" component={MultasGP03} />
          <ProtectedRoute path="/bases/gp03/sinistros" component={SinistrosGP03} />
          <ProtectedRoute path="/bases/gp03/acidentes-trabalho" component={AcidentesTrabalhoGP03} />
          <ProtectedRoute path="/bases/gp03/solicitacao-pneus" component={SolicitacaoPneusGP03} />
          <ProtectedRoute path="/bases/gp03/solicitacao-orcamento" component={SolicitacaoOrcamentoGP03} />
          <ProtectedRoute path="/bases/gp03/manutencao-frota" component={ManutencaoFrotaGP03} />
          <ProtectedRoute path="/bases/gp03/cartoes-ativos" component={CartoesAtivosGP03} />
          
          {/* Rotas de funcionalidades específicas para as bases GRUPO PEREIRA */}
          <ProtectedRoute path="/bases/gp01/cartao-combustivel" component={CartaoCombustivelGP01} />
          <ProtectedRoute path="/bases/gp02/cartao-combustivel" component={CartaoCombustivelGP02} />
          <ProtectedRoute path="/bases/gp03/cartao-combustivel" component={CartaoCombustivelGP03} />
          
          {/* Rotas genéricas para todas as bases por ID - DEVE VIR DEPOIS DAS ESPECÍFICAS */}
          <ProtectedRoute path="/bases/:id" component={() => <BaseRouteHandler mode="home" />} />
          <ProtectedRoute path="/bases/:id/cartao-combustivel" component={() => <BaseRouteHandler mode="fuel-card" />} />
          <Route path="/bases/:id/login" component={() => <BaseRouteHandler mode="login" />} />
          
          <ProtectedRoute path="/solicitacoes" component={BaseRequests} />
          
          {/* Rotas para os postos de abastecimento - protegidas */}
          <ProtectedRoute path="/postos" component={IndexPostos} />
          <ProtectedRoute path="/postos/links-externos" component={LinksExternosPostos} />
          <ProtectedRoute path="/posto/osasco" component={PostoOsasco} />
          <ProtectedRoute path="/posto/osasco_v2" component={PostoOsascoV2} />
          <ProtectedRoute path="/posto/guarulhos" component={PostoGuarulhos} />
          <ProtectedRoute path="/posto/guarulhos_v2" component={PostoGuarulhosV2} />
          <ProtectedRoute path="/posto/alair_v2" component={PostoAlairV2} />
          <ProtectedRoute path="/posto/saopaulo" component={PostoSaoPaulo} />
          <ProtectedRoute path="/posto/campinas" component={PostoCampinas} />
          <ProtectedRoute path="/posto/campinas_v2" component={PostoCampinasV2} />
          <ProtectedRoute path="/posto/abc" component={PostoABC} />
          <ProtectedRoute path="/posto/abc_v2" component={PostoABCV2} />
          <ProtectedRoute path="/posto/socorro" component={PostoSocorro} />
          <ProtectedRoute path="/posto/socorro_v2" component={PostoSocorroV2} />
          <ProtectedRoute path="/posto/sorocaba" component={PostoSorocaba} />
          <ProtectedRoute path="/posto/sorocaba_v2" component={PostoSorocabaV2} />
          <ProtectedRoute path="/postos/historico-geral" component={HistoricoGeralPage} />
          <ProtectedRoute path="/postos/historico-patio" component={HistoricoPatioPage} />
          <ProtectedRoute path="/postos/historico-consolidado" component={HistoricoConsolidado} />
          <ProtectedRoute path="/postos/consumo-diario" component={ConsumoDiarioPorDia} />
          <ProtectedRoute path="/postos/visao-geral" component={PostosVisaoGeralIntegrada} />
          <ProtectedRoute path="/postos/entradas-combustivel" component={EntradaCombustivelPage} />
          <ProtectedRoute path="/postos/:id" component={PostoDetalhesPage} />
          <ProtectedRoute path="/diagnostico/supabase" component={SupabaseDiagnostico} />
          <ProtectedRoute path="/diagnostico/supabase-console" component={SupabaseConsole} />
          <ProtectedRoute path="/diagnostico/comparacao-esquemas" component={ComparacaoEsquemas} />
          <ProtectedRoute path="/diagnostico/sincronizar-tabelas" component={SincronizarTabelasPage} />
          <ProtectedRoute path="/diagnostico/api-tester" component={ApiTester} />
          <ProtectedRoute path="/diagnostico/autenticacao" component={AutenticacaoDiagnostico} />
          <ProtectedRoute path="/diagnostico/budget-attachments-migration" component={BudgetAttachmentsMigration} />

          <ProtectedRoute path="/diagnostico/auto-save-demo" component={AutoSaveDemo} />
          <ProtectedRoute path="/admin/utils" component={AdminUtils} />
          <ProtectedRoute path="/admin/coordenadores" component={CoordinatorManagement} />
          <ProtectedRoute path="/limpar-dados" component={LimparDados} />
          <ProtectedRoute path="/line-hall-shopee" component={LineHallShopeePage} />
          {/* Página dedicada para solicitações de cartão combustível do Line Haul */}
          <ProtectedRoute path="/line-hall-fuel-requests" component={LineHallFuelCardRequests} />
          
          {/* Página para gerenciamento de terceiros no sistema principal */}
          <ProtectedRoute path="/terceiros/gerenciamento" component={GerenciamentoTerceiros} />
          <ProtectedRoute path="/fuel-card-old" component={FuelCardPage} />
          {/* Página principal de solicitações de cartão combustível */}
          <ProtectedRoute path="/fuel-card-requests" component={FuelCardRequestsPanel} />
          <ProtectedRoute path="/fuel-card-dashboard" component={FuelCard} />
          {/* Página otimizada para solicitação mobile */}
          <Route path="/fuel-card/solicitation" component={FuelCardSolicitation} />
          <ProtectedRoute path="/posto-remedios" component={PostoRemediosPage} />
          <ProtectedRoute path="/cartao-abastecimento" component={CartaoAbastecimentoPage} />
          <ProtectedRoute path="/abastecimento" component={PainelPostosPage} />
          <ProtectedRoute path="/abastecimentos" component={AbastecimentosPage} />
          <ProtectedRoute path="/drivers" component={DriversPage} />
          <ProtectedRoute path="/manutencao" component={ManutencaoPage} />
          <ProtectedRoute path="/tratativa-manutencao" component={TratativaManutencaoPage} />
          <ProtectedRoute path="/maintenance/oficinas-credentials" component={OficinasCredentialsPage} />
          <ProtectedRoute path="/maintenance/workshop-external-access" component={WorkshopExternalAccess} />
          <ProtectedRoute path="/tires" component={TiresPage} />
          
          {/* Rota pública para checklist do motorista */}
          <Route path="/checklist/:id">
            <DriverChecklist />
          </Route>
          
          {/* Rota para verificação de motorista por CPF */}
          <Route path="/driver-checklist">
            <DriverChecklist />
          </Route>
          
          {/* Rota pública para acesso do motorista Line Haul */}
          <Route path="/line-hall-driver">
            <MotoristaLineHall />
          </Route>
          
          {/* Rota para o perfil do usuário Supabase */}
          <Route path="/profile-supabase">
            <ProfileWithSupabase />
          </Route>
          
          {/* Rota para teste de login de base */}
          <Route path="/test-login-base">
            <TestLoginBase />
          </Route>
          
          {/* Rota para registro de usuários de postos */}
          <Route path="/register-supabase">
            <RegisterPostoUser />
          </Route>
          
          {/* Rota pública para acesso externo das oficinas */}
          <Route path="/workshop/:workshopId">
            <WorkshopExternal />
          </Route>
          
          {/* Dashboard externo da oficina com token */}
          <Route path="/oficina/external" component={OficinaExternalDashboard} />
          
          {/* Rota para acesso de motoristas do Line Haul */}
          <Route path="/line-hall-driver">
            <LineHallDriverPage />
          </Route>
          
          {/* Rotas para acesso do motorista Line Haul Murici */}
          <Route path="/app/system/driver-access">
            <DriverAccess />
          </Route>
          
          <Route path="/app/system/driver-checklist/:id">
            <DriverChecklist />
          </Route>
          
          <Route path="/app/system/driver-maintenance-request/:id">
            <DriverMaintenanceRequest />
          </Route>
          
          {/* Rota para gerenciamento de manutenções do Line Haul */}
          <ProtectedRoute path="/line-hall-maintenance" component={LineHallMaintenanceManager} />
          <ProtectedRoute path="/line-hall-checklists" component={LineHallChecklistManager} />
          
          {/* Rota para redirecionamento rápido para postos - sem autenticação */}
          <Route path="/redirect-posto/:posto">
            <RedirectToPosto />
          </Route>
          
          {/* Rota de acesso direto a todos os postos */}
          <Route path="/acesso-posto">
            <PostoAcessoDireto />
          </Route>
          
          {/* Rotas para parceiros de guincho */}
          <Route path="/partner/login">
            <PartnerLogin />
          </Route>
          <Route path="/partner/dashboard">
            <PartnerDashboard />
          </Route>
          
          {/* Rota pública para cadastro de oficinas */}
          <Route path="/oficinas/cadastro">
            <OficinasExternaPage />
          </Route>
          
          {/* Rota de acesso para oficinas - login específico */}
          <Route path="/oficina">
            <SignIn oficina={true} />
          </Route>
          <Route path="/oficina-supabase">
            <LoginWithSupabase oficina={true} />
          </Route>
          
          {/* Rotas protegidas para oficinas */}
          <ProtectedRoute path="/oficina/dashboard" component={OficinaDashboard} />
          <ProtectedRoute path="/oficinas/dashboard" component={OficinaDashboard} /> {/* Rota alternativa para compatibilidade */}
          <ProtectedRoute path="/oficina/murici" component={OficinaMurici} />
          <ProtectedRoute path="/oficinas/murici" component={OficinaMurici} /> {/* Rota alternativa para compatibilidade */}
          <ProtectedRoute path="/oficina-alair-estoque" component={OficinaAlairEstoque} />
          
          {/* Rotas públicas para os postos de abastecimento - sem proteção e sem status de tanques */}
          <Route path="/posto/osasco/public">
            <OsascoPublic />
          </Route>
          <Route path="/posto/osasco_v2/public">
            <OsascoV2Public />
          </Route>
          <Route path="/posto-externo/osasco_v2">
            <OsascoV2Public />
          </Route>
          <Route path="/posto/guarulhos/public">
            <GuarulhosPublic />
          </Route>
          <Route path="/posto/guarulhos_v2/public">
            <GuarulhosV2Public />
          </Route>
          <Route path="/posto/alair_v2/public">
            <AlairV2Public />
          </Route>
          <Route path="/posto/saopaulo/public">
            <SaoPauloPublic />
          </Route>
          <Route path="/posto/campinas/public">
            <CampinasPublic />
          </Route>
          <Route path="/posto/campinas_v2/public">
            <CampinasV2Public />
          </Route>
          <Route path="/posto/abc/public">
            <ABCPublic />
          </Route>
          <Route path="/posto/abc_v2/public">
            <ABCV2Public />
          </Route>
          <Route path="/posto/socorro/public">
            <SocorroPublic />
          </Route>
          <Route path="/posto/socorro_v2/public">
            <SocorroV2Public />
          </Route>
          <Route path="/posto/sorocaba_v2/public">
            <SorocabaV2Public />
          </Route>
          
          {/* Rotas públicas para o GRUPO PEREIRA */}
          <Route path="/posto/gp01/public">
            <PublicPostoGP01 />
          </Route>
          <Route path="/posto/gp02/public">
            <PublicPostoGP02 />
          </Route>
          <Route path="/posto/gp03/public">
            <PublicPostoGP03 />
          </Route>
          

          
          {/* Rotas externas para postos V2 - Registro de recebimentos de combustível */}
          <Route path="/postos-externos">
            <PostosExternosIndex />
          </Route>
          <Route path="/posto-externo/abc-v2">
            <PostoABCV2External />
          </Route>
          <Route path="/posto-externo/campinas-v2">
            <PostoCampinasV2External />
          </Route>
          
          {/* Rotas públicas para o Posto Remédios */}
          <Route path="/posto-remedios-standalone">
            <PostoRemediosStandalone />
          </Route>
          
          {/* Acesso externo para o Posto Remédios */}
          <Route path="/posto-remedios-externo">
            <PostoRemediosStandalone />
          </Route>
          
          {/* Sistema de Manutenção Veicular - Acesso público para oficinas */}
          <Route path="/maintenance">
            <MaintenanceSystem />
          </Route>
          
          {/* Login da Oficina */}
          <Route path="/maintenance/login-oficina">
            <OficinaLogin />
          </Route>
          
          {/* Login da Oficina - Rota direta */}
          <Route path="/oficina/login">
            <OficinaLogin />
          </Route>
          
          {/* Dashboard da Oficina */}
          <Route path="/maintenance/dashboard-oficina">
            <OficinaDashboard />
          </Route>
          
          {/* Acesso Externo da Oficina via Token - SEM CNPJ */}
          <Route path="/oficina/external">
            <OficinaExternalDashboard />
          </Route>
          
          {/* Sistema de Recebimento de Carros */}
          <Route path="/maintenance/car-reception">
            <CarReception />
          </Route>
          
          {/* URL que o usuário estava tentando acessar */}
          <Route path="/postos/remedios/externo">
            <PostoRemediosStandalone />
          </Route>
          
          {/* Formulário simplificado para Abastecimento do Posto Remédios */}
          <Route path="/abastecimento-posto-remedios">
            <AbastecimentoPostoRemediosPage />
          </Route>
          
          {/* Redirecionamento da rota antiga para a definitiva */}
          <Route path="/fuel-card">
            <FuelCardRedirect />
          </Route>
          
          {/* Rota pública para solicitação de cartão combustível - acessível sem login */}
          <Route path="/fuel-card/solicitation">
            <div className="mt-16 pl-4 pr-4 md:pl-16">
              <FuelCardSolicitation />
            </div>
          </Route>
          
          {/* Rota pública para confirmação de solicitação de cartão combustível */}
          <Route path="/fuel-card/confirmation">
            <div className="mt-16 pl-4 pr-4 md:pl-16">
              <FuelCardConfirmation />
            </div>
          </Route>
          
          <ProtectedRoute path="/fuel-card/station-profile" component={() => (
            <div className="mt-16 pl-4 pr-4 md:pl-64">
              <StationProfile />
            </div>
          )} />
          
          {/* Rotas do Sistema de Abastecimento Terceiros - acesso externo sem proteção */}
          <Route path="/terceiros/login">
            <AbastecimentoTerceirosLogin />
          </Route>
          <Route path="/terceiros/dashboard">
            <AbastecimentoTerceirosDashboard />
          </Route>

          {/* Sistema de Manutenção - Acesso exclusivo para oficinas */}
          <Route path="/maintenance*">
            <MaintenanceSystem />
          </Route>
          
          <Route>
            <NotFound />
          </Route>
        </Switch>
        <Toaster />
        </AuthProvider>
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
