# Sistema de Notificações do Admin - Guia de Integração

## 📋 Visão Geral

O sistema de notificações permite que administradores criem avisos e recados que aparecem automaticamente nas páginas designadas (Dashboard, Chat, Comunidade, Profissionais, Vídeos).

---

## 🔧 Como Funciona

### 1. **Criação de Notificações (Admin)**

No painel `/admin`, aba "Recados", o administrador pode:
- Escolher a página/seção onde o aviso aparecerá
- Definir título e mensagem
- Configurar datas de início e fim (opcional)
- Ativar/desativar avisos

### 2. **Exibição Automática**

O componente `NotificationBanner` busca automaticamente as notificações ativas para a página específica e as exibe no topo.

---

## 📦 Componente NotificationBanner

### Localização
```
src/react-app/components/NotificationBanner.tsx
```

### Props
```typescript
interface NotificationBannerProps {
  pageSection: 'chat' | 'community' | 'professionals' | 'dashboard' | 'videos';
}
```

### Funcionalidades
- ✅ Busca notificações ativas do Firestore
- ✅ Filtra por página/seção
- ✅ Filtra por data (start_date e end_date)
- ✅ Permite dispensar avisos (salva no localStorage)
- ✅ Design responsivo e atraente

---

## 🚀 Como Integrar em Cada Página

### 1. **Dashboard** (`src/react-app/pages/Dashboard.tsx`)

```tsx
import NotificationBanner from '../components/NotificationBanner';

// Dentro do return, antes do conteúdo principal:
return (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1>Bem-vindo!</h1>
      </div>

      {/* ADICIONAR AQUI */}
      <NotificationBanner pageSection="dashboard" />

      {/* Resto do conteúdo */}
      {renderDashboard()}
    </div>
  </div>
);
```

---

### 2. **Chat com Dra. Clara** (`src/react-app/pages/Chat.tsx`)

```tsx
import NotificationBanner from '../components/NotificationBanner';

// Dentro do return, logo após o header:
return (
  <div className="flex flex-col h-screen">
    {/* Header do Chat */}
    <header>...</header>

    {/* ADICIONAR AQUI */}
    <div className="px-4 pt-4">
      <NotificationBanner pageSection="chat" />
    </div>

    {/* Área de mensagens */}
    <div className="flex-1 overflow-y-auto">
      {messages.map(...)}
    </div>
  </div>
);
```

---

### 3. **Comunidade** (`src/react-app/pages/Community.tsx`)

```tsx
import NotificationBanner from '../components/NotificationBanner';

// Dentro do return, antes dos posts:
return (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <h1>Comunidade</h1>

      {/* ADICIONAR AQUI */}
      <NotificationBanner pageSection="community" />

      {/* Posts da comunidade */}
      <div className="space-y-4">
        {posts.map(...)}
      </div>
    </div>
  </div>
);
```

---

### 4. **Profissionais** (`src/react-app/pages/Professionals.tsx`)

```tsx
import NotificationBanner from '../components/NotificationBanner';

// Dentro do return, antes da lista de profissionais:
return (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <h1>Profissionais</h1>

      {/* ADICIONAR AQUI */}
      <NotificationBanner pageSection="professionals" />

      {/* Grid de profissionais */}
      <div className="grid grid-cols-3 gap-6">
        {professionals.map(...)}
      </div>
    </div>
  </div>
);
```

---

### 5. **Biblioteca de Vídeos** (`src/react-app/pages/VideoLibrary.tsx`)

```tsx
import NotificationBanner from '../components/NotificationBanner';

// Dentro do return, antes dos vídeos:
return (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <h1>Biblioteca de Vídeos</h1>

      {/* ADICIONAR AQUI */}
      <NotificationBanner pageSection="videos" />

      {/* Grid de vídeos */}
      <div className="grid grid-cols-4 gap-6">
        {videos.map(...)}
      </div>
    </div>
  </div>
);
```

---

## 🎨 Exemplo Visual

Quando um admin cria um aviso, ele aparece assim:

```
┌────────────────────────────────────────────────────┐
│ 🔔 Palestra Especial Amanhã!                    [X]│
│                                                     │
│ Teremos uma palestra incrível com Dr. João Silva   │
│ sobre Ansiedade Social às 19h. Não perca!          │
│                                                     │
│ [Aviso do Admin] Válido até 15/12/2024             │
└────────────────────────────────────────────────────┘
```

---

## 📊 Estrutura de Dados (Firestore)

### Collection: `notifications`

```typescript
{
  id: string;                    // Auto-gerado
  page_section: string;          // 'chat' | 'community' | 'professionals' | 'dashboard' | 'videos'
  title: string;                 // "Palestra Especial"
  message: string;               // "Teremos uma palestra..."
  is_active: boolean;            // true/false
  start_date: string;            // "2024-12-01" (opcional)
  end_date: string;              // "2024-12-15" (opcional)
  createdAt: Timestamp;          // Auto-gerado
}
```

---

## ✅ Checklist de Integração

Para cada página que deve exibir notificações:

- [ ] Importar `NotificationBanner`
- [ ] Adicionar `<NotificationBanner pageSection="..." />` no local apropriado
- [ ] Testar criando um aviso no painel admin
- [ ] Verificar se o aviso aparece na página correta
- [ ] Testar botão de dispensar (X)
- [ ] Testar filtro de datas

---

## 🐛 Troubleshooting

### Notificações não aparecem?

1. **Verificar se está ativa**: No admin, verifique se `is_active` está marcado
2. **Verificar datas**: Se definiu `start_date` ou `end_date`, verifique se está no período
3. **Verificar page_section**: Deve corresponder exatamente ao valor usado no componente
4. **Console do navegador**: Abra F12 e veja se há erros no console

### Notificação aparece em página errada?

- Verifique o valor de `page_section` no Firestore
- Valores válidos: `'chat'`, `'community'`, `'professionals'`, `'dashboard'`, `'videos'`

---

## 🔐 Segurança

- Apenas admins autorizados podem criar notificações
- Emails autorizados estão hardcoded em `AdminDashboard.tsx`:
  - `gtosegbot@`
  - `admgtoseg@`
  - `disparoseguroback@gmail.com`

---

## 📝 Exemplo Completo de Uso

### 1. Admin cria aviso:
```
Página: Chat (Dra. Clara)
Título: Manutenção Programada
Mensagem: O chat estará indisponível amanhã das 2h às 4h para manutenção.
Data Início: 2024-12-10
Data Fim: 2024-12-11
```

### 2. Usuário acessa o chat:
- Vê o banner no topo
- Pode clicar no [X] para dispensar
- Banner desaparece após a data de fim

---

## 🎯 Próximos Passos

1. Integrar em todas as 5 páginas principais
2. Testar com avisos reais
3. Adicionar analytics (quantas pessoas viram/dispensaram)
4. Adicionar suporte a links clicáveis na mensagem
5. Adicionar suporte a imagens/ícones customizados

---

**Última atualização**: Dezembro 2024
**Versão**: 1.0
