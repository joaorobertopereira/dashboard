# Instruções de Instalação e Execução

## Pré-requisitos

- Node.js 20+ instalado
- npm ou yarn

## Instalação

### Backend (NestJS)

```powershell
cd backend
npm install
```

### Frontend (Angular)

```powershell
cd frontend
npm install
```

## Execução

### 1. Inicie o Backend

Em um terminal:

```powershell
cd backend
npm run start:dev
```

O backend estará rodando em:
- **HTTP:** http://localhost:3000
- **WebSocket:** ws://localhost:3000/processing

### 2. Inicie o Frontend

Em outro terminal:

```powershell
cd frontend
ng serve
```

ou

```powershell
npm start
```

O frontend estará disponível em: **http://localhost:4200**

## Testando

1. Acesse http://localhost:4200
2. Clique em "Iniciar Processamento"
3. Observe as atualizações em tempo real
4. O chip no topo mostra qual estratégia está ativa (WebSocket ou HTTP Polling)

### Testando Fallback

Para testar o fallback automático:

1. Com tudo rodando, pare o backend (Ctrl+C)
2. No frontend, tente iniciar uma tarefa
3. Observe o fallback automático para HTTP Polling
4. Reinicie o backend
5. Tente trocar manualmente a estratégia usando os botões de demonstração

## Scripts Disponíveis

### Backend

- `npm run start` - Inicia em modo produção
- `npm run start:dev` - Inicia em modo desenvolvimento com hot reload
- `npm run build` - Compila o projeto

### Frontend

- `ng serve` ou `npm start` - Inicia servidor de desenvolvimento
- `ng build` - Compila para produção
- `ng build --watch` - Compila em modo watch

## Troubleshooting

### Erro de CORS

Se você encontrar erros de CORS, verifique se:
- O backend está rodando na porta 3000
- O frontend está rodando na porta 4200
- As configurações de CORS em `backend/src/main.ts` estão corretas

### Erro de Conexão WebSocket

Se o WebSocket não conectar:
- Verifique se o backend está rodando
- Abra o console do navegador para ver logs
- O sistema deve fazer fallback automático para HTTP

### Porta em Uso

Se as portas estiverem em uso:
- Backend: Altere a porta em `backend/src/main.ts`
- Frontend: Use `ng serve --port 4201` (ou outra porta)

## Estrutura

```
dashboard/
├── backend/           # NestJS Backend
│   ├── src/
│   └── package.json
├── frontend/          # Angular Frontend
│   ├── src/
│   └── package.json
└── README.md         # Documentação principal
```
