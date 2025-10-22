 import { StrictMode } from 'react'
 import { createRoot } from 'react-dom/client'
 import { BrowserRouter } from 'react-router-dom'
 import { AuthProvider } from './context/AuthContext'
 import './index.css'
 import 'primereact/resources/themes/lara-light-blue/theme.css'
 import 'primereact/resources/primereact.min.css'
 import 'primeflex/primeflex.css'
 import 'primeicons/primeicons.css'
 import App from './App.jsx'

 createRoot(document.getElementById('root')).render(
   <StrictMode>
     <AuthProvider>
       <BrowserRouter>
         <App />
       </BrowserRouter>
     </AuthProvider>
   </StrictMode>,
 )
