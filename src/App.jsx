 import { Routes, Route, Link } from 'react-router-dom'
 import ProtectedRoute from './components/ProtectedRoute'
 import Login from './pages/Login'
 import Dashboard from './pages/Dashboard'
 import Productos from './pages/Productos'
 import Stock from './pages/Stock'
 import Categorias from './pages/Categorias'
 import Proveedores from './pages/Proveedores'
 import Usuarios from './pages/Usuarios'
import Facturacion from './pages/Facturacion'
import Clientes from './pages/Clientes'
 import Reportes from './pages/Reportes'
 import Configuracion from './pages/Configuracion'
 import AppLayout from './layout/AppLayout'
 import RoleRoute from './components/RoleRoute'

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
          <Route
            path="productos"
            element={
              <RoleRoute allow={['admin']}>
                <Productos />
              </RoleRoute>
            }
          />
          <Route path="stock" element={<Stock />} />
          <Route
            path="categorias"
            element={
              <RoleRoute allow={['admin']}>
                <Categorias />
              </RoleRoute>
            }
          />
          <Route
            path="proveedores"
            element={
              <RoleRoute allow={['admin']}>
                <Proveedores />
              </RoleRoute>
            }
          />
          <Route
            path="usuarios"
            element={
              <RoleRoute allow={['admin']}>
                <Usuarios />
              </RoleRoute>
            }
          />
          <Route
            path="clientes"
            element={
              <RoleRoute allow={['admin']}>
                <Clientes />
              </RoleRoute>
            }
          />
          <Route
            path="facturacion"
            element={
              <RoleRoute allow={['admin','vendedor']}>
                <Facturacion />
              </RoleRoute>
            }
          />
          <Route
            path="reportes"
            element={
              <RoleRoute allow={['admin']}>
                <Reportes />
              </RoleRoute>
            }
          />
          <Route
            path="configuracion"
            element={
              <RoleRoute allow={['admin']}>
                <Configuracion />
              </RoleRoute>
            }
          />
        </Route>

        <Route path="*" element={<div className="p-3">No encontrado. <Link to="/">Ir al inicio</Link></div>} />
      </Routes>
    </div>
  )
}

export default App
