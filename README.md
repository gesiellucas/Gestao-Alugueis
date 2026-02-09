# GC Loca Moto - Gestão de Locação de Motos

Sistema completo de gestão para locadora de motocicletas com integração Supabase, IA (Google Gemini) e WhatsApp.

## Tecnologias

- **Frontend**: React 19 + TypeScript + Vite
- **Roteamento**: React Router DOM v7
- **Banco de Dados**: Supabase (PostgreSQL)
- **IA**: Google Gemini API
- **UI**: Tailwind CSS (inferido) + Lucide Icons
- **Gráficos**: Recharts

## Funcionalidades

### 1. Gestão de Frota
- Cadastro e controle de motocicletas
- Status em tempo real (Disponível, Alugada, Em Manutenção, Indisponível)
- Controle de quilometragem
- Upload de imagens

### 2. Gestão de Clientes
- Cadastro de parceiros/clientes
- Controle de contratos ativos
- Gestão de débitos e pagamentos
- Integração WhatsApp para contato

### 3. Contratos de Aluguel
- Criação e gerenciamento de contratos
- Histórico completo
- Cálculo automático de duração
- Relatórios financeiros

### 4. Oficina/Manutenção
- Registro de entradas para manutenção
- Tipos: Preventiva, Corretiva, Troca de Óleo, Troca de Pneu, Vistoria
- Controle de status (Aberto/Concluído)
- Histórico por veículo

### 5. Automação com IA
- Geração automática de mensagens de cobrança (Google Gemini)
- Resumo inteligente da oficina no Dashboard
- Integração WhatsApp Web

### 6. Dashboard Analytics
- KPIs: Total da frota, ocupação, manutenções, receita diária
- Gráfico de receita dos últimos 7 dias
- Distribuição da frota (em rota, pátio, oficina)

## Configuração do Supabase

### Passo 1: Criar Projeto

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta ou faça login
3. Clique em "New Project"
4. Preencha:
   - **Name**: `gc-loca-moto`
   - **Database Password**: Escolha uma senha forte
   - **Region**: Selecione a região mais próxima (ex: South America - São Paulo)
5. Aguarde a criação do projeto (~2 minutos)

### Passo 2: Executar o Schema

1. No painel do Supabase, vá em **SQL Editor** (ícone de banco de dados no menu lateral)
2. Clique em **New Query**
3. Copie **TODO** o conteúdo do arquivo [`supabase/schema.sql`](supabase/schema.sql)
4. Cole no editor SQL
5. Clique em **Run** (ou pressione `Ctrl+Enter`)
6. Verifique se todas as tabelas foram criadas sem erros

### Passo 3: Configurar Variáveis de Ambiente

1. No Supabase, vá em **Settings** > **API**
2. Copie os valores:
   - **Project URL** (ex: `https://abc123xyz.supabase.co`)
   - **anon public** key (chave longa começando com `eyJ...`)

3. Abra o arquivo `.env.local` na raiz do projeto
4. Substitua os valores:

```env
GEMINI_API_KEY=SUA_CHAVE_GEMINI_AQUI

# Supabase
VITE_SUPABASE_URL=https://SEU_PROJETO_ID.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY_AQUI
```

### Passo 4: (Opcional) Popular Banco com Dados de Teste

Se quiser inserir os dados mock no banco:

```sql
-- Inserir veículos
INSERT INTO vehicles (plate, model, brand, year, status, mileage, image_url, default_monthly_rate) VALUES
('GCL-0001', 'Honda CG 160 Fan', 'Honda', 2024, 'Disponível', 1250, 'https://app.autoslim.com.br/uploads/motos/1733489668.jpg', 800.00),
('GCL-0002', 'Honda CG 160 Start', 'Honda', 2024, 'Disponível', 800, 'https://app.autoslim.com.br/uploads/motos/1733489668.jpg', 780.00),
('GCL-0003', 'Honda CG 160 Titan', 'Honda', 2024, 'Em Manutenção', 5400, 'https://app.autoslim.com.br/uploads/motos/1733489668.jpg', 820.00);

-- Inserir clientes
INSERT INTO customers (name, phone, cpf, active_contract, balance_due, last_payment_date) VALUES
('Ricardo Entregas', '5511999991111', '123.456.789-01', true, 0, '2024-03-20'),
('Lucas Motoboy', '5511988882222', '234.567.890-02', true, 420.00, '2024-03-10');
```

## Instalação e Execução

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar `.env.local`

Certifique-se de ter preenchido o arquivo `.env.local` com as credenciais corretas (veja Passo 3 acima).

### 3. Executar em desenvolvimento

```bash
npm run dev
```

O app estará disponível em `http://localhost:3000`

### 4. Build para produção

```bash
npm run build
npm run preview
```

## Estrutura do Projeto

```
├── components/          # Componentes React
│   ├── Dashboard.tsx   # Dashboard com KPIs e gráficos
│   ├── VehicleCard.tsx # Card de veículo
│   ├── FleetManager.tsx
│   ├── Workshop.tsx
│   └── ...
├── pages/              # Páginas/rotas
│   ├── VeiculosPage.tsx
│   ├── ClientesPage.tsx
│   ├── OficinaPage.tsx
│   ├── AlugueisPage.tsx
│   ├── WhatsAppPage.tsx
│   └── ...
├── contexts/
│   └── AppContext.tsx  # Estado global (integrado com Supabase)
├── services/
│   ├── api/            # Serviços da API Supabase
│   │   ├── vehicles.ts
│   │   ├── customers.ts
│   │   ├── rentalContracts.ts
│   │   └── maintenanceRecords.ts
│   └── geminiService.ts # Integração Google Gemini
├── lib/
│   └── supabase.ts     # Cliente Supabase tipado
├── types/
│   └── database.ts     # Tipos gerados do Supabase
├── types.ts            # Interfaces TypeScript
├── constants.ts        # Dados mock (fallback)
├── supabase/
│   └── schema.sql      # Schema completo do banco
└── .env.local          # Variáveis de ambiente
```

## API Supabase - Serviços Disponíveis

### Veículos (`vehiclesApi`)
```typescript
vehiclesApi.getAll()                    // Buscar todos
vehiclesApi.getById(id)                 // Buscar por ID
vehiclesApi.create(vehicle)             // Criar novo
vehiclesApi.update(id, updates)         // Atualizar
vehiclesApi.delete(id)                  // Deletar
vehiclesApi.getAvailable()              // Buscar disponíveis
vehiclesApi.getRented()                 // Buscar alugados
vehiclesApi.getInMaintenance()          // Buscar em manutenção
vehiclesApi.updateStatus(id, status)    // Atualizar status
```

### Clientes (`customersApi`)
```typescript
customersApi.getAll()
customersApi.getWithActiveContract()    // Com contrato ativo
customersApi.getWithDebt()              // Com débito
customersApi.updateBalance(id, amount)  // Atualizar saldo
customersApi.getByCpf(cpf)              // Buscar por CPF
```

### Contratos (`rentalContractsApi`)
```typescript
rentalContractsApi.getActive()          // Contratos ativos
rentalContractsApi.getByVehicle(id)     // Por veículo
rentalContractsApi.getByCustomer(id)    // Por cliente
rentalContractsApi.end(id)              // Encerrar contrato
```

### Manutenção (`maintenanceRecordsApi`)
```typescript
maintenanceRecordsApi.getOpen()         // Em andamento
maintenanceRecordsApi.getCompleted()    // Concluídas
maintenanceRecordsApi.getByVehicle(id)  // Por veículo
maintenanceRecordsApi.complete(id)      // Finalizar manutenção
maintenanceRecordsApi.getToday()        // Manutenções de hoje
```

## Controle de Acesso (RLS)

O banco de dados está protegido com **Row Level Security (RLS)**. As políticas atuais permitem:

- **Leitura**: Todos os usuários autenticados
- **Escrita**: Todos os usuários autenticados

Para produção, customize as políticas em `supabase/schema.sql` conforme suas regras de negócio.

## Próximos Passos (Sugestões)

1. **Autenticação**: Implementar login com Supabase Auth
2. **Real-time**: Usar Supabase Realtime para updates automáticos
3. **Storage**: Upload de imagens de veículos no Supabase Storage
4. **Relatórios**: Exportar relatórios em PDF
5. **Notificações**: Sistema de notificações push
6. **Mobile**: App React Native com mesma base de código

## Suporte

Para dúvidas sobre Supabase: [Documentação Oficial](https://supabase.com/docs)
Para dúvidas sobre o projeto: Abra uma issue no repositório
