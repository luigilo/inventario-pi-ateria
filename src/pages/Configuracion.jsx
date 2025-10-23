 import { useRef, useState } from 'react'
 import { Button } from 'primereact/button'
 import { Card } from 'primereact/card'
 import { Toast } from 'primereact/toast'
 import { seedAll } from '../services/seed'
 import { useAuth } from '../context/AuthContext'

 export default function Configuracion() {
   const { user, role } = useAuth()
   const toast = useRef(null)
   const [loading, setLoading] = useState(false)

   const runSeed = async () => {
     try {
       setLoading(true)
       await seedAll(user?.uid)
       toast.current?.show({ severity: 'success', summary: 'Inicialización completa', detail: 'Colecciones y datos de ejemplo creados' })
     } catch (err) {
       toast.current?.show({ severity: 'error', summary: 'Error', detail: err?.message || 'Fallo al inicializar' })
     } finally {
       setLoading(false)
     }
   }

   return (
     <div className="p-3">
       <Toast ref={toast} />
       <h2 className="mb-3">Configuración</h2>
       <div className="grid">
         <div className="col-12 lg:col-6">
           <Card title="Inicializar Firestore" subTitle="Crear colecciones e insertar datos de ejemplo (solo admin)">
             <p className="m-0 text-700">Crea categorías, proveedores y algunos productos de muestra. También asigna el rol <b>admin</b> al usuario actual.</p>
             <div className="mt-3">
               <Button label={loading ? 'Inicializando...' : 'Ejecutar inicialización'} icon="pi pi-database" onClick={runSeed} disabled={role !== 'admin'} loading={loading} />
               {role !== 'admin' && <small className="block mt-2 text-600">Necesitas rol admin para ejecutar esta acción.</small>}
             </div>
           </Card>
         </div>
       </div>
     </div>
   )
 }
