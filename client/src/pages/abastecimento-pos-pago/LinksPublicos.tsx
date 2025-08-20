import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ExternalLink, 
  Copy, 
  Fuel,
  QrCode,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function LinksPublicosAbastecimento() {
  const [copiedLink, setCopiedLink] = useState<string>('');

  const copyToClipboard = (text: string, linkId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(linkId);
    setTimeout(() => setCopiedLink(''), 2000);
  };

  // Links de teste com o token que criamos
  const testToken = '40e10918-9ffe-4759-8634-8886e0504fba';
  const baseUrl = window.location.origin;

  const linksDemo = [
    {
      id: 'demo-1',
      title: 'SC (ABC) SSP17 - GRUPO PEREIRA',
      description: 'Link de teste para a base SC (ABC) SSP17 com projeto GRUPO PEREIRA',
      token: testToken,
      url: `${baseUrl}/abastecimento-pos-pago?t=${testToken}`,
      status: 'ativo',
      baseId: 69,
      projetoId: 1
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Links Públicos - Abastecimento Pós-Pago</h1>
          <p className="text-gray-600">Links de acesso público para registro de abastecimentos</p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Estes links são utilizados pelos motoristas para registrar abastecimentos no sistema pós-pago.
          Cada link está associado a uma base e projeto específicos.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {linksDemo.map((link) => (
          <Card key={link.id} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{link.title}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{link.description}</p>
                </div>
                <Badge className={link.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {link.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Base ID:</span>
                  <div className="font-medium">{link.baseId}</div>
                </div>
                <div>
                  <span className="text-gray-500">Projeto ID:</span>
                  <div className="font-medium">{link.projetoId}</div>
                </div>
                <div>
                  <span className="text-gray-500">Token:</span>
                  <div className="font-mono text-xs">{link.token.substring(0, 8)}...</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Link Público de Acesso:
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-50 px-3 py-2 rounded-md text-sm overflow-x-auto">
                    {link.url}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(link.url, link.id)}
                    className="shrink-0"
                  >
                    {copiedLink === link.id ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(link.url, '_blank')}
                    className="shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                {copiedLink === link.id && (
                  <p className="text-xs text-green-600 mt-1">Link copiado para a área de transferência!</p>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Como usar este link:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Compartilhe este link com os motoristas da base/projeto</li>
                  <li>• O motorista poderá acessar diretamente sem fazer login</li>
                  <li>• Todos os dados serão associados automaticamente à base e projeto corretos</li>
                  <li>• O sistema validará o token antes de aceitar qualquer registro</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Informações Técnicas:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Token completo:</span>
                    <div className="font-mono text-xs break-all">{link.token}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Formato da URL:</span>
                    <div className="font-mono text-xs">
                      /abastecimento-pos-pago?t={'{token}'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-orange-900 mb-2">Importante - Segurança dos Links</h3>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• Cada token é único e está associado a uma base/projeto específicos</li>
                <li>• Tokens podem ter data de expiração configurável</li>
                <li>• É possível desativar tokens a qualquer momento no painel administrativo</li>
                <li>• Todos os registros são logados e auditados automaticamente</li>
                <li>• O sistema valida a integridade dos dados antes de salvar</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5" />
              Funcionalidades do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Registro sem necessidade de login
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Validação automática de dados
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Cálculo automático de litros
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Interface otimizada para mobile
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Associação automática base/projeto
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Sistema de auditoria completo
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Próximos Passos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                Gerar QR Codes para facilitar acesso
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                Configurar notificações por WhatsApp
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                Implementar upload de comprovantes
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                Integrar com sistema de GPS
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                Relatórios avançados em PDF/Excel
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}