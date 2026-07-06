# Clinleste — Balanço Financeiro

Sistema de **balanço financeiro** da clínica Clinleste. O sistema **não processa
pagamentos** — apenas **registra** o que entra (Pix, espécie e cartão de débito)
e consolida o balanço por período e forma de pagamento.

## Etapa 1 — Frontend (esta entrega)

Shell da aplicação em **React + Vite + TypeScript** (strict), sem login ainda.

- Menu lateral com a logo e as páginas: **Início, Entradas, Procedimentos, Balanço, Admin**
- Bloco de usuário no menu (informações + **Sair**)
- Todo o CSS em `rem` (base `1rem = 16px`); design alvo **1360 × 680 px**
- Paleta extraída da logo: azul-aço `#6f9fc4`, azul-marinho `#1a1f42`, cinza `#c0c4cc`
- Estrutura já preparada para os perfis **gestor** (acesso total) e **operador** (acesso parcial)

### Rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # checa os tipos (tsc)
npm run build      # tsc && vite build -> dist/
```

### Estrutura

```
src/
  assets/            logo
  styles/            tokens.css (cores/rem) + global.css (reset)
  config/            nav.ts (menu + roles + tipos) · pages.ts (títulos)
  lib/               session.ts (placeholder — vira auth na Etapa 2)
  components/
    layout/          AppLayout · Sidebar · Topbar  (.tsx)
    ui/              Card · StatCard · Badge · Placeholder · Icon  (.tsx)
  pages/             Inicio · Entradas · Procedimentos · Balanco · Admin · NaoEncontrada  (.tsx)
  vite-env.d.ts      tipos do Vite (CSS modules, assets)

tsconfig.json  →  strict + noUncheckedIndexedAccess
```

## Próximas etapas

**Etapa 2 — Backend + PostgreSQL + Autenticação.** Banco novo em PostgreSQL,
API, login e controle de acesso por perfil. Diretrizes de segurança de mercado
(e além) a aplicar:

- Senhas com **hash** (argon2id/bcrypt) — nunca em texto puro; o hash nunca trafega para o front
- Sessão via **cookie httpOnly + Secure + SameSite**; CSRF token em operações de escrita
- **Autorização no servidor** por perfil (o front nunca é fonte de verdade de permissão)
- Consultas **parametrizadas** (anti SQL injection) e validação de entrada (schema)
- **Rate limiting** no login, bloqueio progressivo e headers de segurança (CSP, HSTS)
- **Trilha de auditoria** imutável de todo registro/edição de entrada (quem, quando, o quê)
- Segredos só em variáveis de ambiente (`.env` fora do versionamento)
- Valores monetários em inteiro (centavos) para evitar erro de ponto flutuante

> Observação: os valores exibidos na Etapa 1 estão zerados — serão alimentados
> pelo banco na Etapa 2.
