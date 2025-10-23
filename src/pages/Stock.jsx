 import { useEffect, useRef, useState } from 'react'
 import { DataTable } from 'primereact/datatable'
 import { Column } from 'primereact/column'
 import { Dropdown } from 'primereact/dropdown'
 import { InputNumber } from 'primereact/inputnumber'
 import { InputText } from 'primereact/inputtext'
 import { Button } from 'primereact/button'
 import { Toast } from 'primereact/toast'
 import { listMovements, addMovement } from '../services/stock'
 import { listProducts } from '../services/products'

 export default function Stock() {
   const toast = useRef(null)
   const [loading, setLoading] = useState(true)
   const [movs, setMovs] = useState([])
   const [products, setProducts] = useState([])
   const [form, setForm] = useState({ productId: '', type: 'in', units: 1, note: '' })
   const LOW = 5

   const load = async () => {
     try {
       setLoading(true)
       const [ms, ps] = await Promise.all([listMovements(), listProducts()])
       setMovs(ms)
       setProducts(ps)
       const lows = ps.filter((p) => Number(p.quantity || 0) < LOW)
       if (lows.length) {
         toast.current?.show({ severity: 'warn', summary: 'Bajo stock', detail: `${lows.length} productos por debajo de ${LOW}` })
       }
     } finally {
       setLoading(false)
     }
   }

   useEffect(() => {
     load()
   }, [])

   const submit = async (e) => {
     e.preventDefault()
     try {
       await addMovement(form)
       setForm({ productId: '', type: 'in', units: 1, note: '' })
       toast.current?.show({ severity: 'success', summary: 'Movimiento registrado' })
       await load()
     } catch {
       toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar' })
     }
   }

   const productOptions = products.map((p) => ({ label: `${p.name} (x${p.quantity ?? 0})`, value: p.id }))

   return (
     <div className="p-3">
       <Toast ref={toast} />
       <h2 className="mb-3">Movimientos de stock</h2>

       <form onSubmit={submit} className="grid mb-3 align-items-end">
         <div className="col-12 md:col-4">
           <label className="text-sm">Producto</label>
           <Dropdown value={form.productId} options={productOptions} onChange={(e) => setForm((s) => ({ ...s, productId: e.value }))} placeholder="Selecciona" filter />
         </div>
         <div className="col-6 md:col-2">
           <label className="text-sm">Tipo</label>
           <Dropdown value={form.type} options={[{ label: 'Entrada', value: 'in' }, { label: 'Salida', value: 'out' }]} onChange={(e) => setForm((s) => ({ ...s, type: e.value }))} />
         </div>
         <div className="col-6 md:col-2">
           <label className="text-sm">Unidades</label>
           <InputNumber value={form.units} onValueChange={(e) => setForm((s) => ({ ...s, units: e.value ?? 1 }))} min={1} />
         </div>
         <div className="col-12 md:col-3">
           <label className="text-sm">Nota</label>
           <InputText value={form.note} onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))} />
         </div>
         <div className="col-12 md:col-1">
           <Button type="submit" label="Registrar" className="w-full" />
         </div>
       </form>

       <DataTable value={movs} loading={loading} paginator rows={10} emptyMessage="Sin movimientos" size="small">
         <Column field="productName" header="Producto" sortable />
         <Column field="type" header="Tipo" body={(r) => (r.type === 'in' ? 'Entrada' : 'Salida')} sortable />
         <Column field="units" header="Unidades" sortable />
         <Column field="note" header="Nota" />
       </DataTable>
     </div>
   )
 }
