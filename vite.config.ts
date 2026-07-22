import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Alvo do build: 'site' | 'sistema' | 'tudo'. Ver src/config/alvo.ts.
//
// Injetado por `define` (literal fixo no código) em vez de import.meta.env:
// o Vite não substituiu VITE_ALVO vindo do shell, a expressão virou
// `undefined` em silêncio e os dois builds saíram idênticos — com o sistema
// inteiro dentro do bundle público. `define` é substituição garantida, e é o
// que permite ao Rollup podar o alvo que não é este.
// Declarado aqui em vez de instalar @types/node: este arquivo roda no Node,
// mas o pacote de tipos traria os globais do Node para a checagem do código
// do navegador também (setTimeout virando NodeJS.Timeout etc.).
declare const process: { env: Record<string, string | undefined> }

const ALVO = process.env.VITE_ALVO ?? 'tudo'

// CSP da LANDING, embutida como <meta> no build do site. O sistema já tem
// CSP via helmet (servido pelo Express); a landing é estática e pode parar
// em qualquer host — a meta garante a política independentemente de quem
// servir. Conferida contra o build real:
//  - media-src 'self': o vídeo do hero é do próprio site;
//  - frame-src google.com: o mapa da seção Sobre é um iframe do Maps;
//  - style-src 'unsafe-inline': React usa style={{}} (não executa código);
//  - o resto: só a própria origem, sem objeto/plugin, sem base furtiva.
const CSP_LANDING = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "media-src 'self'",
  'frame-src https://www.google.com',
  "connect-src 'self'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'csp-da-landing',
      // Só no build do SITE: em dev ('tudo') atrapalharia o HMR, e no
      // sistema quem manda é o helmet do Express.
      transformIndexHtml(html) {
        if (ALVO !== 'site') return html
        return html.replace(
          '<meta charset="UTF-8" />',
          `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP_LANDING}" />`,
        )
      },
    },
  ],
  define: { __ALVO__: JSON.stringify(ALVO) },
  server: {
    port: 5173,
    strictPort: false,
    // Chama a API no mesmo origin em dev (evita CORS e mantém o cookie).
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
