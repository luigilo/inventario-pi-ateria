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
 import './App.css'

 function App() {
   return (
     <div className="min-h-screen">
       <Routes>
         <Route path="/login" element={<Login />} />

         <Route
           path="/"
           element={
             <ProtectedRoute>
               <Dashboard />
             </ProtectedRoute>
           }
         />

         <Route
           path="/productos"
           element={
             <ProtectedRoute>
               <Productos />
             </ProtectedRoute>
           }
         />
         <Route
           path="/stock"
           element={
             <ProtectedRoute>
               <Stock />
             </ProtectedRoute>
           }
         />
         <Route
           path="/categorias"
           element={
             <ProtectedRoute>
               <Categorias />
             </ProtectedRoute>
           }
         />
         <Route
           path="/proveedores"
           element={
             <ProtectedRoute>
               <Proveedores />
             </ProtectedRoute>
           }
         />
         <Route
           path="/reportes"
           element={
             <ProtectedRoute>
               <Reportes />
             </ProtectedRoute>
           }
         />
         <Route
           path="/configuracion"
           element={
             <ProtectedRoute>
               <Configuracion />
             </ProtectedRoute>
           }
         />
         <Route path="*" element={<div className="p-3">No encontrado. <Link to="/">Ir al inicio</Link></div>} />
       </Routes>
     </div>
   )
 }

 export default App
