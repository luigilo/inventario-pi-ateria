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
 import { useAuth } from '../context/AuthContext'

export default function Stock() {
  const toast = useRef(null)
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [movs, setMovs] = useState([])
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ productId: '', type: 'in', units: 1, note: '', saleType: 'detal', priceAtSale: 0, costAtEntry: 0 })
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
      const payload = { ...form, userId: user?.uid || null, userEmail: user?.email || null }
      if (payload.type === 'in') {
        payload.totalCost = Number(payload.units || 0) * Number(payload.costAtEntry || 0)
      }
      await addMovement(payload)
      setForm({ productId: '', type: 'in', units: 1, note: '', saleType: 'detal', priceAtSale: 0, costAtEntry: 0 })
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
        {form.type === 'out' && (
          <>
            <div className="col-6 md:col-2">
              <label className="text-sm">Venta</label>
              <Dropdown
                value={form.saleType}
                options={[
                  { label: 'Detal', value: 'detal' },
                  { label: 'Mayor', value: 'mayor' },
                ]}
                onChange={(e) => setForm((s) => ({ ...s, saleType: e.value }))}
              />
            </div>
            <div className="col-6 md:col-2">
              <label className="text-sm">Precio venta (COP)</label>
              <InputNumber
                value={form.priceAtSale}
                onValueChange={(e) => setForm((s) => ({ ...s, priceAtSale: e.value ?? 0 }))}
                mode="currency"
                currency="COP"
                locale="es-CO"
                minFractionDigits={0}
                maxFractionDigits={0}
                min={0}
              />
            </div>
            <div className="col-12 md:col-2">
              <label className="text-sm">Total (COP)</label>
              <div className="p-inputtext p-component" style={{ padding: '0.75rem' }}>
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                  Number(form.units || 0) * Number(form.priceAtSale || 0),
                )}
              </div>
            </div>
          </>
        )}
        {form.type === 'in' && (
          <>
            <div className="col-6 md:col-2">
              <label className="text-sm">Costo unitario (COP)</label>
              <InputNumber
                value={form.costAtEntry}
                onValueChange={(e) => setForm((s) => ({ ...s, costAtEntry: e.value ?? 0 }))}
                mode="currency"
                currency="COP"
                locale="es-CO"
                minFractionDigits={0}
                maxFractionDigits={0}
                min={0}
              />
            </div>
            <div className="col-12 md:col-2">
              <label className="text-sm">Total costo (COP)</label>
              <div className="p-inputtext p-component" style={{ padding: '0.75rem' }}>
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                  Number(form.units || 0) * Number(form.costAtEntry || 0),
                )}
              </div>
            </div>
          </>
        )}
        <div className="col-12 md:col-1">
          <Button type="submit" label="Registrar" className="w-full" />
        </div>
      </form>

      <DataTable value={movs} loading={loading} paginator rows={10} emptyMessage="Sin movimientos" size="small">
        <Column field="productName" header="Producto" sortable />
        <Column field="type" header="Tipo" body={(r) => (r.type === 'in' ? 'Entrada' : 'Salida')} sortable />
        <Column field="units" header="Unidades" sortable />
        <Column field="saleType" header="Venta" body={(r) => (r.type === 'out' ? (r.saleType === 'mayor' ? 'Mayor' : 'Detal') : '—')} />
        <Column
          field="priceAtSale"
          header="Precio venta"
          body={(r) => (r.type === 'out' ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(r.priceAtSale || 0)) : '—')}
        />
        <Column
          field="total"
          header="Total"
          body={(r) => (r.type === 'out' ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(r.total || 0)) : '—')}
        />
        <Column
          field="costAtEntry"
          header="Costo unitario"
          body={(r) => (r.type === 'in' ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(r.costAtEntry || 0)) : '—')}
        />
        <Column
          field="totalCost"
          header="Total costo"
          body={(r) => (r.type === 'in' ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(r.totalCost || 0)) : '—')}
        />
        <Column field="userEmail" header="Vendedor" body={(r) => (r.type === 'out' ? (r.userEmail || '—') : '—')} />
        <Column field="note" header="Nota" />
      </DataTable>
    </div>
  )
}
