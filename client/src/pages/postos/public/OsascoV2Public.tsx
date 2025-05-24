import React, { useEffect } from 'react';
import PublicPostoPage from '../PublicPostoPage';
import { POSTO_OSASCO_V2, NOME_POSTO_OSASCO_V2 } from '@/constants/postos';

// Componente especializado para o posto Osasco V2, com tratamento de erros específico
const OsascoV2Public: React.FC = () => {
  // Ativar modo de compatibilidade para resolver problemas no DOM
  useEffect(() => {
    // Adicionar um script inline para garantir compatibilidade com dispositivos móveis
    const compatScript = document.createElement('script');
    compatScript.textContent = `
      // Fix para erro de "removeChild" em seletores de projetos
      window.addEventListener('error', function(event) {
        if (event.message && event.message.includes('removeChild')) {
          console.warn('[OSASCO V2] Erro DOM detectado, adicionando correção:', event.message);
          event.preventDefault();
          
          // Substituir todos os selects sofisticados por nativos
          setTimeout(function() {
            try {
              // Encontrar os selects problemáticos e substituí-los
              document.querySelectorAll('button[id="projeto"]').forEach(function(selectTrigger) {
                // Encontrar o select container pai
                var selectContainer = selectTrigger.closest('div');
                if (selectContainer && !selectContainer.classList.contains('fixed')) {
                  // Criar select nativo
                  var nativeSelect = document.createElement('select');
                  nativeSelect.id = 'projeto';
                  nativeSelect.name = 'projeto';
                  nativeSelect.className = 'w-full p-2 border rounded mt-1';
                  nativeSelect.style.minHeight = '42px';
                  nativeSelect.style.fontSize = '16px';
                  
                  // Adicionar opções
                  var projectOptions = [
                    'GRUPO PEREIRA',
                    'COCA COLA',
                    'SHOPEE',
                    'MERCADO LIVRE',
                    'LINE HALL SHOPEE',
                    'FULL MELI',
                    'MADEIRA MADEIRA',
                    'MAGALU',
                    'NATURA',
                    'OXXO',
                    'PETLOVE',
                    'REMÉDIOS'
                  ];
                  
                  // Opção padrão
                  var defaultOption = document.createElement('option');
                  defaultOption.value = '';
                  defaultOption.textContent = 'Selecione o projeto';
                  nativeSelect.appendChild(defaultOption);
                  
                  // Adicionar todas as opções de projeto
                  projectOptions.forEach(function(projectName) {
                    var option = document.createElement('option');
                    option.value = projectName;
                    option.textContent = projectName;
                    nativeSelect.appendChild(option);
                  });
                  
                  // Substituir o componente React pelo select nativo
                  selectContainer.parentNode.insertBefore(nativeSelect, selectContainer);
                  selectContainer.style.display = 'none';
                  selectContainer.classList.add('fixed');
                  
                  // Adicionar listener para refletir a mudança para o componente React
                  nativeSelect.addEventListener('change', function(e) {
                    // Disparar evento personalizado para informar a mudança
                    var customEvent = new CustomEvent('nativeSelectChange', { 
                      detail: { value: e.target.value, id: 'projeto' } 
                    });
                    document.dispatchEvent(customEvent);
                  });
                }
              });
            } catch (e) {
              console.error('[OSASCO V2] Erro ao aplicar fix DOM:', e);
            }
          }, 500);
        }
      });
    `;
    document.head.appendChild(compatScript);
    
    // Listener para processar mudanças do select nativo
    const handleNativeSelectChange = (event) => {
      const { value, id } = event.detail;
      // Encontrar o input hidden ou elemento React correspondente e atualizar
      try {
        const reactSelect = document.querySelector(`button[id="${id}"]`);
        if (reactSelect) {
          // Simulando um clique para abrir o dropdown e selecionar a opção
          const changeEvent = new Event('change', { bubbles: true });
          const hiddenInput = reactSelect.closest('div').querySelector('input[type="hidden"]');
          if (hiddenInput) {
            hiddenInput.value = value;
            hiddenInput.dispatchEvent(changeEvent);
          }
        }
      } catch (e) {
        console.error('[OSASCO V2] Erro ao processar mudança de select nativo:', e);
      }
    };
    
    document.addEventListener('nativeSelectChange', handleNativeSelectChange);
    
    return () => {
      document.removeEventListener('nativeSelectChange', handleNativeSelectChange);
      // Remover o script de compatibilidade
      try {
        if (compatScript && document.head.contains(compatScript)) {
          document.head.removeChild(compatScript);
        }
      } catch (e) {
        console.error('[OSASCO V2] Erro ao limpar scripts de compatibilidade:', e);
      }
    };
  }, []);

  return <PublicPostoPage id={POSTO_OSASCO_V2} nomePosto={NOME_POSTO_OSASCO_V2} />;
};

export default OsascoV2Public;