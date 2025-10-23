import { useEffect, useMemo, useRef, useState } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Dropdown } from 'primereact/dropdown'
import { Calendar } from 'primereact/calendar'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { listMovements } from '../services/stock'
import { listProducts } from '../services/products'

function formatCOP(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n || 0))
}

export default function Reportes() {
  const toast = useRef(null)
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])
  const [products, setProducts] = useState([])
  const [filters, setFilters] = useState({ productId: '', saleType: 'all', seller: '', range: null })

  const load = async () => {
    try {
      setLoading(true)
      const [movs, prods] = await Promise.all([listMovements(), listProducts()])
      setProducts(prods)
      // solo ventas
      const existing = new Set(prods.map((p) => p.id))
      const sales = movs.filter((m) => m.type === 'out' && existing.has(m.productId))
      setRows(sales)
    } catch (e) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: e?.message || 'No se pudieron cargar los datos' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const productOptions = useMemo(() => [{ label: 'Todos', value: '' }, ...products.map((p) => ({ label: p.name, value: p.id }))], [products])
  const sellerOptions = useMemo(() => {
    const set = new Set(rows.filter((r) => r.type === 'out' && r.userEmail).map((r) => r.userEmail))
    return [{ label: 'Todos', value: '' }, ...Array.from(set).map((e) => ({ label: e, value: e }))]
  }, [rows])
  const saleTypeOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Detal', value: 'detal' },
    { label: 'Mayor', value: 'mayor' },
  ]

  const filtered = useMemo(() => {
    const [start, end] = filters.range || []
    // normalizar valores de filtros para 'Todos'
    const productId = (filters.productId ?? '').toString()
    const saleType = (filters.saleType ?? 'all').toString()
    const seller = (filters.seller ?? '').toString()

    // camino rápido: todo seleccionado y sin rango => devolver filas completas
    if (!productId && saleType === 'all' && !seller && !(start || end)) return rows

    return rows.filter((r) => {
      if (productId && String(r.productId) !== productId) return false
      if (saleType !== 'all' && String(r.saleType) !== saleType) return false
      if (seller && String(r.userEmail || '') !== seller) return false
      if (start || end) {
        const ts = r.createdAt?.seconds ? r.createdAt.seconds * 1000 : Number(r.createdAt || 0)
        const startMs = start ? new Date(start.getTime()).setHours(0, 0, 0, 0) : null
        const endMs = end ? new Date(end.getTime()).setHours(23, 59, 59, 999) : null
        if (startMs !== null && ts < startMs) return false
        if (endMs !== null && ts > endMs) return false
      }
      return true
    })
  }, [rows, filters])

  const totals = useMemo(() => {
    const units = filtered.reduce((a, r) => a + Number(r.units || 0), 0)
    const total = filtered.reduce((a, r) => a + Number(r.total || 0), 0)
    const detal = filtered.filter((r) => r.saleType === 'detal').reduce((a, r) => a + Number(r.total || 0), 0)
    const mayor = filtered.filter((r) => r.saleType === 'mayor').reduce((a, r) => a + Number(r.total || 0), 0)
    return { count: filtered.length, units, total, detal, mayor }
  }, [filtered])

  const exportCSV = () => {
    const header = ['Fecha', 'Producto', 'Venta', 'Unidades', 'Precio', 'Total', 'Vendedor']
    const lines = filtered.map((r) => {
      const dt = r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000) : new Date(Number(r.createdAt || Date.now()))
      const fecha = dt.toLocaleDateString('es-CO') + ' ' + dt.toLocaleTimeString('es-CO')
      return [
        fecha,
        (r.productName || ''),
        r.saleType === 'mayor' ? 'Mayor' : 'Detal',
        Number(r.units || 0),
        Number(r.priceAtSale || 0),
        Number(r.total || 0),
        r.userEmail || '',
      ]
        .map((x) => (typeof x === 'string' ? `"${x.replace(/"/g, '""')}"` : x))
        .join(',')
    })
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'reporte_ventas.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const printPDF = () => {
    const win = window.open('', '_blank')
    const rowsHtml = filtered
      .map((r) => {
        const dt = r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000) : new Date(Number(r.createdAt || Date.now()))
        return `<tr>
          <td>${dt.toLocaleDateString('es-CO')} ${dt.toLocaleTimeString('es-CO')}</td>
          <td>${r.productName || ''}</td>
          <td>${r.saleType === 'mayor' ? 'Mayor' : 'Detal'}</td>
          <td style="text-align:right;">${Number(r.units || 0)}</td>
          <td style="text-align:right;">${formatCOP(r.priceAtSale)}</td>
          <td style="text-align:right;">${formatCOP(r.total)}</td>
          <td>${r.userEmail || ''}</td>
        </tr>`
      })
      .join('')

    const html = `<!doctype html>
    <html><head><meta charset="utf-8"/>
    <title>Reporte de Ventas</title>
    <style>
      body{font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding:24px;}
      h2{margin:0 0 12px}
      table{width:100%; border-collapse: collapse; font-size:12px}
      th,td{border:1px solid #e5e7eb; padding:6px}
      th{background:#f9fafb; text-align:left}
      tfoot td{font-weight:600}
    </style></head>
    <body>
      <h2>Reporte de Ventas</h2>
      <div style="margin-bottom:10px;">Registros: ${totals.count} &nbsp; · &nbsp; Unidades: ${totals.units} &nbsp; · &nbsp; Total: ${formatCOP(totals.total)} (Detal: ${formatCOP(totals.detal)} · Mayor: ${formatCOP(totals.mayor)})</div>
      <table>
        <thead>
          <tr><th>Fecha</th><th>Producto</th><th>Venta</th><th>Unidades</th><th>Precio</th><th>Total</th><th>Vendedor</th></tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <script>window.onload = () => window.print()</script>
    </body></html>`
    win.document.write(html)
    win.document.close()
  }

  return (
    <div className="p-3">
      <Toast ref={toast} />
      <h2 className="mb-3">Reportes</h2>

      <div className="grid mb-3 align-items-end">
        <div className="col-12 md:col-4">
          <label className="text-sm">Producto</label>
          <Dropdown value={filters.productId} options={productOptions} onChange={(e) => setFilters((s) => ({ ...s, productId: e.value ?? '' }))} placeholder="Todos" filter showClear />
        </div>
        <div className="col-6 md:col-3">
          <label className="text-sm">Tipo de venta</label>
          <Dropdown value={filters.saleType} options={saleTypeOptions} onChange={(e) => setFilters((s) => ({ ...s, saleType: e.value ?? 'all' }))} showClear />
        </div>
        <div className="col-6 md:col-3">
          <label className="text-sm">Vendedor</label>
          <Dropdown value={filters.seller} options={sellerOptions} onChange={(e) => setFilters((s) => ({ ...s, seller: e.value ?? '' }))} placeholder="Todos" filter showClear />
        </div>
        <div className="col-12 md:col-5">
          <label className="text-sm">Rango de fechas</label>
          <Calendar value={filters.range} onChange={(e) => setFilters((s) => ({ ...s, range: e.value }))} selectionMode="range" readOnlyInput className="w-full" placeholder="Selecciona rango" showIcon dateFormat="dd/mm/yy" />
        </div>
        <div className="col-12 md:col-2">
          <Button type="button" label="Limpiar filtros" icon="pi pi-filter-slash" onClick={() => setFilters({ productId: '', saleType: 'all', seller: '', range: null })} outlined className="w-full md:w-auto" />
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <Button label="Exportar CSV" icon="pi pi-download" onClick={exportCSV} outlined />
        <Button label="Exportar PDF" icon="pi pi-file-pdf" onClick={printPDF} />
      </div>

      <DataTable value={filtered} loading={loading} paginator rows={10} emptyMessage="Sin datos" size="small">
        <Column field="productName" header="Producto" sortable />
        <Column field="saleType" header="Venta" body={(r) => (r.saleType === 'mayor' ? 'Mayor' : 'Detal')} sortable />
        <Column field="units" header="Unidades" sortable />
        <Column field="priceAtSale" header="Precio" body={(r) => formatCOP(r.priceAtSale)} sortable />
        <Column field="total" header="Total" body={(r) => formatCOP(r.total)} sortable />
        <Column field="userEmail" header="Vendedor" sortable />
        <Column
          field="createdAt"
          header="Fecha"
          body={(r) => {
            const dt = r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000) : new Date(Number(r.createdAt || Date.now()))
            return dt.toLocaleString('es-CO')
          }}
          sortable
        />
      </DataTable>
    </div>
  )
}
