 import { Routes, Route, Link } from 'react-router-dom'
 import ProtectedRoute from './components/ProtectedRoute'
 import Login from './pages/Login'
 import Dashboard from './pages/Dashboard'
 import Productos from './pages/Productos'
 import Stock from './pages/Stock'
 import Categorias from './pages/Categorias'
 import Proveedores from './pages/Proveedores'
 import Reportes from './pages/Reportes'
 import Configuracion from './pages/Configuracion'
 import AppLayout from './layout/AppLayout'

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="productos" element={<Productos />} />
          <Route path="stock" element={<Stock />} />
          <Route path="categorias" element={<Categorias />} />
          <Route path="proveedores" element={<Proveedores />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="configuracion" element={<Configuracion />} />
        </Route>

        <Route path="*" element={<div className="p-3">No encontrado. <Link to="/">Ir al inicio</Link></div>} />
      </Routes>
    </div>
  )
}

export default App
