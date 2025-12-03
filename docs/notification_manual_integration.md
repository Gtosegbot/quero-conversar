# Integração Manual do NotificationBanner

## ✅ CHAT.TSX - Integração Completa

### 1. Adicionar Import (linha ~5)
```tsx
import NotificationBanner from '../components/NotificationBanner';
```

### 2. Substituir o bloco antigo de notificações (linhas 303-327)

**REMOVER:**
```tsx
{/* Admin Notifications Banner */}
{notifications.length > 0 && (
  <div className="bg-orange-50 border-b border-orange-100 p-3">
    <div className="max-w-4xl mx-auto">
      {notifications.map(notif => (
        <div key={notif.id} className="flex items-start justify-between mb-2 last:mb-0">
          <div className="flex items-start">
            <Bell className="w-5 h-5 text-orange-600 mr-2 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-900">{notif.title}</p>
              <p className="text-sm text-orange-800">{notif.message}</p>
            </div>
          </div>
          <button
            onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
            className="text-orange-500 hover:text-orange-700"
          >
            <span className="sr-only">Fechar</span>
            ×
          </button>
        </div>
      ))}
    </div>
  </div>
)}
```

**ADICIONAR:**
```tsx
{/* Admin Notifications */}
<div className="max-w-4xl mx-auto px-4 pt-4">
  <NotificationBanner pageSection="chat" />
</div>
```

---

## ✅ COMMUNITY.TSX - Integração

### 1. Adicionar Import
```tsx
import NotificationBanner from '../components/NotificationBanner';
```

### 2. Adicionar após o header da página
```tsx
{/* Admin Notifications */}
<NotificationBanner pageSection="community" />
```

**Localização sugerida**: Logo após o título "Comunidade" e antes dos posts

---

## ✅ PROFESSIONALS.TSX - Integração

### 1. Adicionar Import
```tsx
import NotificationBanner from '../components/NotificationBanner';
```

### 2. Adicionar após o header da página
```tsx
{/* Admin Notifications */}
<NotificationBanner pageSection="professionals" />
```

**Localização sugerida**: Logo após o título "Profissionais" e antes da lista/grid de profissionais

---

## ✅ VIDEOLIBRARY.TSX (se existir) - Integração

### 1. Adicionar Import
```tsx
import NotificationBanner from '../components/NotificationBanner';
```

### 2. Adicionar após o header da página
```tsx
{/* Admin Notifications */}
<NotificationBanner pageSection="videos" />
```

**Localização sugerida**: Logo após o título "Biblioteca de Vídeos" e antes da grid de vídeos

---

## 🎯 Padrão Geral de Integração

Para QUALQUER página que queira exibir notificações do admin:

```tsx
// 1. Import no topo do arquivo
import NotificationBanner from '../components/NotificationBanner';

// 2. No JSX, logo após o header/título da página
<div className="max-w-7xl mx-auto px-4">
  <h1>Título da Página</h1>
  
  {/* Admin Notifications */}
  <NotificationBanner pageSection="NOME_DA_SECAO" />
  
  {/* Resto do conteúdo */}
</div>
```

**Valores válidos para `pageSection`:**
- `"dashboard"`
- `"chat"`
- `"community"`
- `"professionals"`
- `"videos"`

---

## 📝 Checklist de Integração

- [x] Dashboard - JÁ INTEGRADO
- [ ] Chat - Adicionar manualmente
- [ ] Community - Adicionar manualmente
- [ ] Professionals - Adicionar manualmente
- [ ] VideoLibrary - Adicionar manualmente (se existir)

---

## 🧪 Como Testar

1. Acesse `/admin`
2. Aba "Recados"
3. Crie um recado para cada página
4. Acesse cada página e verifique se o banner aparece
5. Teste o botão [X] para dispensar
6. Teste com datas de início/fim

---

## 🐛 Se não funcionar

1. Verifique o console do navegador (F12)
2. Verifique se o import está correto
3. Verifique se o `pageSection` corresponde ao criado no admin
4. Verifique se a notificação está com `is_active: true` no Firestore

---

**Última atualização**: Dezembro 2024
