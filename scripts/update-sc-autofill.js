/**
 * Script para aplicar auto-preenchimento em todas as bases SC com projeto Mercado Livre
 * Este script irá atualizar todos os formulários de cartão combustível das bases SC
 * para automaticamente preencher o projeto e a base correspondente
 */

const fs = require('fs');
const path = require('path');

// Função para aplicar o auto-preenchimento em um componente
function applyAutoFillToComponent(filePath, baseName) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Arquivo não encontrado: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Verificar se já tem auto-preenchimento implementado
  if (content.includes('detectSCContext') || content.includes('autoFillSCContext')) {
    console.log(`✅ Auto-preenchimento já implementado em: ${baseName}`);
    return true;
  }

  // Implementar a lógica de auto-preenchimento
  const autoFillLogic = `
  // Auto-preenchimento para bases SC do projeto Mercado Livre
  useEffect(() => {
    const applyAutoFill = async () => {
      try {
        const response = await fetch('/api/public/projects-with-bases', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            // Encontrar projeto Mercado Livre
            const mercadoLivreProject = data.data.find(p => p.name.includes('MERCADO LIVRE'));
            if (mercadoLivreProject) {
              // Encontrar a base SC correspondente
              const scBase = mercadoLivreProject.bases.find(b => 
                b.base_name.includes('${baseName}') || 
                b.base_name.includes('SC')
              );

              if (scBase) {
                setFormData(prev => ({
                  ...prev,
                  projeto: mercadoLivreProject.id.toString(),
                  base: scBase.id.toString()
                }));
                setSelectedProject(mercadoLivreProject);
                
                toast({
                  title: '🎯 Auto-preenchimento aplicado',
                  description: \`Projeto: \${mercadoLivreProject.name} | Base: \${scBase.base_name}\`,
                  variant: 'default'
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Erro no auto-preenchimento:', error);
      }
    };

    if (projects.length > 0) {
      applyAutoFill();
    }
  }, [projects]);`;

  // Encontrar o useEffect que carrega projetos e adicionar a lógica
  const useEffectPattern = /useEffect\(\(\) => \{[\s\S]*?loadProjectsWithBases\(\);[\s\S]*?\}, \[\]\);/;
  
  if (useEffectPattern.test(content)) {
    content = content.replace(useEffectPattern, (match) => {
      return match.replace('loadProjectsWithBases();', `loadProjectsWithBases();${autoFillLogic}`);
    });
  } else {
    // Se não encontrar o padrão, adicionar no final do componente
    const componentEndPattern = /export default \w+;/;
    content = content.replace(componentEndPattern, `${autoFillLogic}\n\n$&`);
  }

  // Salvar o arquivo atualizado
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Auto-preenchimento aplicado em: ${baseName}`);
  return true;
}

// Lista de bases SC para aplicar auto-preenchimento
const scBases = [
  'ABC', 'ARACATUBA', 'ARENA_BARUERI', 'ATIBAIA', 'AVARE', 'BAHIA_SALVADOR',
  'BAURU', 'BLUMENAU', 'BRASILIA', 'CAMPINA_GRANDE_SUL', 'CAMPINAS_S3',
  'CAMPINAS_S7', 'CAMPO_GRANDE', 'CARAGUATATUBA', 'CASCAVEL', 'CHAPECO',
  'CONTAGEM', 'COTIA', 'CRICIUMA', 'CUIABA', 'CURITIBA', 'DIVINOPOLIS',
  'FLORIANOPOLIS', 'FORTALEZA', 'FRANCA', 'FULL_FILMENTE', 'GOIANIA',
  'GUARAPUAVA', 'ITAPETININGA', 'ITAQUERA', 'ITUPEVA', 'JALES', 'JOINVILLE',
  'LAJEADO', 'LONDRINA', 'MANAUS', 'MARINGA', 'MARILIA', 'MEGA_GUARULHOS',
  'MOGI_CRUZES', 'MOOCA_CENTRO', 'PASSO_FUNDO', 'PATO_BRANCO', 'PATOS_MINAS',
  'PELOTAS', 'PIRACICABA', 'POCOS_CALDAS', 'PONTA_GROSSA', 'PORTO_ALEGRE',
  'PQ_NOVO_MUNDO', 'PRESIDENTE_PRUDENTE', 'QUEIMADOS', 'RECIFE', 'RIBEIRAO_PRETO',
  'SANTA_MARIA', 'SANTOS', 'SAPUCAIA', 'SAO_CARLOS', 'SAO_JOSE_CAMPOS',
  'SJ_RIO_PRETO', 'SOROCABA', 'VITORIA', 'Z_LESTE', 'Z_SUL'
];

// Função principal
async function main() {
  console.log('🚀 Iniciando aplicação de auto-preenchimento nas bases SC...');
  
  let sucessCount = 0;
  let totalCount = 0;

  for (const baseName of scBases) {
    totalCount++;
    const filePath = path.join(__dirname, '..', 'client', 'src', 'pages', 'bases', `CartaoCombustivel${baseName}.tsx`);
    
    if (applyAutoFillToComponent(filePath, baseName)) {
      sucessCount++;
    }
  }

  console.log(`\n📊 Resultado final:`);
  console.log(`✅ Bases atualizadas: ${sucessCount}/${totalCount}`);
  console.log(`🎯 Auto-preenchimento aplicado com sucesso!`);
  
  // Aplicar também no componente principal SC
  const scMainPath = path.join(__dirname, '..', 'client', 'src', 'pages', 'bases', 'CartaoCombustivelSC.tsx');
  if (fs.existsSync(scMainPath)) {
    console.log(`\n🔧 Aplicando no componente principal SC...`);
    if (applyAutoFillToComponent(scMainPath, 'SC')) {
      console.log(`✅ Componente principal SC atualizado!`);
    }
  }
}

// Executar script
main().catch(console.error);