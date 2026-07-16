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


export default defineConfig({
  plugins: [react()],
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
