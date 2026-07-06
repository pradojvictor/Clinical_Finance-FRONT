import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Inicio from './pages/Inicio'
import Entradas from './pages/Entradas'
import Procedimentos from './pages/Procedimentos'
import Balanco from './pages/Balanco'
import Admin from './pages/Admin'
import NaoEncontrada from './pages/NaoEncontrada'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/entradas" element={<Entradas />} />
          <Route path="/procedimentos" element={<Procedimentos />} />
          <Route path="/balanco" element={<Balanco />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NaoEncontrada />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
