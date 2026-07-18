import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import ProtectedRoute from './components/ProtectedRoute'
import Splash from './components/Splash'
import { RAIZ, type Alvo } from './config/alvo'

// Duas regras aqui, e as duas foram aprendidas quebrando o build:
//
// 1) Os lazy() ficam DENTRO do ternário, nunca no topo do módulo. No topo
//    são avaliados sempre e o Rollup emite os chunks do sistema até no
//    build do site.
// 2) A condição usa __ALVO__ (o literal do define) DIRETO, e não as
//    constantes de config/alvo.ts. O Rollup não propaga o valor vindo de
//    outro módulo até o import(), então com TEM_SISTEMA importado o ramo
//    morto sobrevivia e os chunks iam junto do mesmo jeito.
//    config/alvo.ts continua valendo para quem só precisa do valor em
//    tempo de execução (ProtectedRoute, Login, auth).
declare const __ALVO__: Alvo

const site = __ALVO__ !== 'sistema'
  ? {
      Home: lazy(() => import('./pages/Home')),
      ProcedimentoDetalhe: lazy(() => import('./pages/ProcedimentoDetalhe')),
    }
  : null

const sistema = __ALVO__ !== 'site'
  ? {
      Login: lazy(() => import('./pages/Login')),
      AppLayout: lazy(() => import('./components/layout/AppLayout')),
      Inicio: lazy(() => import('./pages/Inicio')),
      Entradas: lazy(() => import('./pages/Entradas')),
      Saidas: lazy(() => import('./pages/Saidas')),
      Transferencias: lazy(() => import('./pages/Transferencias')),
      Procedimentos: lazy(() => import('./pages/Procedimentos')),
      Balanco: lazy(() => import('./pages/Balanco')),
      Admin: lazy(() => import('./pages/Admin')),
      NaoEncontrada: lazy(() => import('./pages/NaoEncontrada')),
    }
  : null

export default function App() {
  const conteudo = (
    <BrowserRouter>
      <Routes>
          {/* Landing — única parte que vai para o domínio público.
              fallback={null} de propósito: a landing tem preloader próprio
              (o do logo em quadrados). Um Splash aqui apareceria ANTES dele
              — logo estático + círculo girando — e o usuário veria dois
              carregamentos em sequência. */}
          {site && (
            <Route
              path="/"
              element={
                <Suspense fallback={null}>
                  <site.Home />
                </Suspense>
              }
            />
          )}
          {site && (
            <Route
              path="/procedimentos/:slug"
              element={
                <Suspense fallback={null}>
                  <site.ProcedimentoDetalhe />
                </Suspense>
              }
            />
          )}

          {/* Sistema (protegido) — roda na máquina da clínica; a equipe
              chega aqui por favorito em /login. Aqui o Splash faz sentido:
              não há preloader próprio. */}
          {sistema && (
            <Route
              path="/login"
              element={
                <Suspense fallback={<Splash texto="Carregando…" />}>
                  <sistema.Login />
                </Suspense>
              }
            />
          )}
          {sistema && (
            <Route path="/sistema" element={<ProtectedRoute />}>
              <Route
                element={
                  <Suspense fallback={<Splash texto="Carregando o sistema…" />}>
                    <sistema.AppLayout />
                  </Suspense>
                }
              >
                <Route index element={<sistema.Inicio />} />
                <Route path="entradas" element={<sistema.Entradas />} />
                <Route path="saidas" element={<sistema.Saidas />} />
                <Route path="transferencias" element={<sistema.Transferencias />} />
                <Route path="procedimentos" element={<sistema.Procedimentos />} />
                <Route path="balanco" element={<sistema.Balanco />} />
                <Route path="admin" element={<sistema.Admin />} />
                <Route path="*" element={<sistema.NaoEncontrada />} />
              </Route>
            </Route>
          )}

          {/* Rota inexistente volta para a raiz DESTE build (no build do
              sistema não existe landing, então a raiz é /sistema). */}
          <Route path="*" element={<Navigate to={RAIZ} replace />} />
      </Routes>
    </BrowserRouter>
  )

  // O build só-landing não tem nada que autentique: nenhuma rota e nenhum
  // componente chamam useAuth. Sem o provider, o Rollup remove junto o
  // cliente HTTP — o site público sai sem uma linha de código de login.
  return __ALVO__ === 'site' ? conteudo : <AuthProvider>{conteudo}</AuthProvider>
}
