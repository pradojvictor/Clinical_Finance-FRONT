import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import ProtectedRoute from './components/ProtectedRoute'
import Splash from './components/Splash'
import Home from './pages/Home'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import AreaCliente from './pages/AreaCliente'

// Code splitting: o SISTEMA carrega em chunks separados do site público,
// então a "loja"/site e o sistema não pesam um no carregamento do outro.
const AppLayout = lazy(() => import('./components/layout/AppLayout'))
const Inicio = lazy(() => import('./pages/Inicio'))
const Entradas = lazy(() => import('./pages/Entradas'))
const Saidas = lazy(() => import('./pages/Saidas'))
const Clientes = lazy(() => import('./pages/Clientes'))
const Transferencias = lazy(() => import('./pages/Transferencias'))
const Procedimentos = lazy(() => import('./pages/Procedimentos'))
const Balanco = lazy(() => import('./pages/Balanco'))
const Admin = lazy(() => import('./pages/Admin'))
const NaoEncontrada = lazy(() => import('./pages/NaoEncontrada'))

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Site público (carrega no chunk principal) */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/minha-conta" element={<AreaCliente />} />

          {/* Sistema (protegido + carregado sob demanda) */}
          <Route path="/sistema" element={<ProtectedRoute />}>
            <Route
              element={
                <Suspense fallback={<Splash texto="Carregando o sistema…" />}>
                  <AppLayout />
                </Suspense>
              }
            >
              <Route index element={<Inicio />} />
              <Route path="entradas" element={<Entradas />} />
              <Route path="saidas" element={<Saidas />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="transferencias" element={<Transferencias />} />
              <Route path="procedimentos" element={<Procedimentos />} />
              <Route path="balanco" element={<Balanco />} />
              <Route path="admin" element={<Admin />} />
              <Route path="*" element={<NaoEncontrada />} />
            </Route>
          </Route>

          {/* Qualquer outra rota volta para o site */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
