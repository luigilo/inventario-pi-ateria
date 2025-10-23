import { useEffect, useMemo, useRef, useState } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Dropdown } from 'primereact/dropdown'
import { Dialog } from 'primereact/dialog'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { listProducts } from '../services/products'
import { listCategories } from '../services/categories'
import { addMovement } from '../services/stock'
import { createInvoice, listInvoices, updateInvoice, deleteInvoice } from '../services/invoices'
import { useAuth } from '../context/AuthContext'
import { getStoreSettings, nextInvoiceNumber } from '../services/settings'
import { listCustomers, createCustomer } from '../services/customers'

function formatCOP(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n || 0))
}

export default function Facturacion() {
  const [STORE, setSTORE] = useState({ name: 'Happy Happy Piñatería', nit: '', address: '', phone: '', logo: '/logoHappy.jpeg' })
  const toast = useRef(null)
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [lines, setLines] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [customer, setCustomer] = useState({ name: '', id: '', email: '' })
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [invoices, setInvoices] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [originalItems, setOriginalItems] = useState([])
  const [customerDialog, setCustomerDialog] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', document: '', email: '', phone: '' })
  const [savingCustomer, setSavingCustomer] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products
    return products.filter((p) => (p.category || '') === selectedCategory)
  }, [products, selectedCategory])

  const productOptions = useMemo(
    () => filteredProducts.map((p) => ({ label: p.name, value: p.id, price: Number(p.price || 0), product: p })),
    [filteredProducts]
  )

  const categoryOptions = useMemo(() => [{ label: 'Todas', value: '' }, ...categories.map((n) => ({ label: n, value: n }))], [categories])

  const totals = useMemo(() => {
    const subtotal = lines.reduce((a, l) => a + Number(l.units || 0) * Number(l.price || 0), 0)
    return { subtotal, total: subtotal }
  }, [lines])

  const load = async () => {
    try {
      setLoading(true)
      const [prods, invs, store, custs, cats] = await Promise.all([
        listProducts(),
        listInvoices(),
        getStoreSettings(),
        listCustomers(),
        listCategories().catch(() => []),
      ])
      setProducts(prods)
      setInvoices(invs)
      setSTORE((s) => ({ ...s, ...store }))
      setCustomers(custs)
      const names = Array.isArray(cats) ? cats.map((x) => x.name).filter(Boolean) : []
      // fallback: derivar de productos si no hay service
      const fromProds = Array.from(new Set(prods.map((p) => p.category).filter(Boolean)))
      setCategories(names.length ? names : fromProds)
    } catch (e) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: e?.message || 'No se pudieron cargar datos' })
    } finally {
      setLoading(false)
    }
  }

  const customerOptions = useMemo(() => customers.map((c) => ({ label: `${c.name}${c.document ? ' · ' + c.document : ''}`, value: c.id, customer: c })), [customers])

  const onSelectCustomer = (id) => {
    setSelectedCustomerId(id || null)
    const c = customers.find((x) => x.id === id)
    if (c) setCustomer({ name: c.name || '', id: c.document || '', email: c.email || '' })
    if (!id) setCustomer({ name: '', id: '', email: '' })
  }

  const openNewCustomer = () => {
    setNewCustomer({ name: customer.name || '', document: customer.id || '', email: customer.email || '', phone: '' })
    setCustomerDialog(true)
  }

  const saveNewCustomer = async () => {
    if (!newCustomer.name?.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Validación', detail: 'El nombre es requerido' })
      return
    }
    setSavingCustomer(true)
    try {
      const created = await createCustomer({
        name: newCustomer.name.trim(),
        document: newCustomer.document?.trim() || '',
        email: newCustomer.email?.trim() || '',
        phone: newCustomer.phone?.trim() || '',
      })
      setCustomers((prev) => [created, ...prev])
      setCustomer({ name: created.name, id: created.document, email: created.email })
      setSelectedCustomerId(created.id)
      setCustomerDialog(false)
      toast.current?.show({ severity: 'success', summary: 'Cliente creado', detail: created.name })
    } catch (e) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: e?.message || 'No se pudo crear el cliente' })
    } finally {
      setSavingCustomer(false)
    }
  }

  const sendInvoiceEmail = async (inv) => {
    const to = inv.customerEmail || customer.email || ''
    if (!to) {
      toast.current?.show({ severity: 'warn', summary: 'Correo faltante', detail: 'La factura no tiene correo de cliente' })
      return
    }
    try {
      const html = buildInvoiceHtml(inv)
      const subject = `Factura ${inv.number ? `N° ${String(inv.number).padStart(6,'0')}` : inv.id || ''} - ${STORE.name || ''}`
      const r = await fetch('/.netlify/functions/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error || 'No se pudo enviar')
      toast.current?.show({ severity: 'success', summary: 'Enviada', detail: `Factura enviada a ${to}` })
    } catch (e) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: e?.message || 'No se pudo enviar' })
    }
  }

  const buildInvoiceHtml = (inv) => {
    const items = Array.isArray(inv.items) ? inv.items : []
    const rowsHtml = items
      .map((it) => {
        const total = Number(it.units || 0) * Number(it.price || 0)
        return `<tr>
          <td>${it.productName || ''}</td>
          <td>${it.saleType === 'mayor' ? 'Mayor' : 'Detal'}</td>
          <td style="text-align:right;">${Number(it.units || 0)}</td>
          <td style="text-align:right;">${formatCOP(it.price)}</td>
          <td style="text-align:right;">${formatCOP(total)}</td>
        </tr>`
      })
      .join('')

    const html = `<!doctype html>
    <html><head><meta charset="utf-8"/>
    <title>Factura ${inv.id || ''}</title>
    <style>
      body{font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding:24px;}
      h2{margin:0 0 12px}
      table{width:100%; border-collapse: collapse; font-size:12px}
      th,td{border:1px solid #e5e7eb; padding:6px}
      th{background:#f9fafb; text-align:left}
      tfoot td{font-weight:600}
      .header{display:flex; align-items:center; gap:16px; margin-bottom:12px}
      .brand{display:flex; flex-direction:column}
      .muted{color:#6b7280}
    </style></head>
    <body>
      <div class="header">
        ${STORE.logo ? `<img src="${STORE.logo}" alt="logo" style="height:64px; width:auto; object-fit:contain"/>` : ''}
        <div class="brand">
          <div style="font-size:18px; font-weight:700;">${STORE.name || ''}</div>
          ${(STORE.nit || STORE.address || STORE.phone) ? `<div class="muted" style="font-size:12px;">
            ${STORE.nit ? `NIT: ${STORE.nit} · ` : ''}${STORE.address || ''}${STORE.phone ? ` · Tel: ${STORE.phone}` : ''}
          </div>` : ''}
        </div>
      </div>

      <h2 style="margin-top:0;">Factura ${inv.number ? `N° ${String(inv.number).padStart(6,'0')}` : inv.id || ''}</h2>
      <div style="margin-bottom:10px;">
        <div><strong>Fecha:</strong> ${new Date(inv.createdAt).toLocaleString('es-CO')}</div>
        <div><strong>Cliente:</strong> ${inv.customerName || ''} &nbsp; · &nbsp; <strong>Documento:</strong> ${inv.customerId || ''}</div>
        <div><strong>Vendedor:</strong> ${inv.userEmail || ''}</div>
      </div>
      <table>
        <thead>
          <tr><th>Producto</th><th>Venta</th><th>Unidades</th><th>Precio</th><th>Total</th></tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
        <tfoot>
          <tr><td colspan="4" style="text-align:right;">Subtotal</td><td style="text-align:right;">${formatCOP(inv.subtotal || 0)}</td></tr>
          <tr><td colspan="4" style="text-align:right;">Total</td><td style="text-align:right;">${formatCOP(inv.total || 0)}</td></tr>
        </tfoot>
      </table>
      ${inv.notes ? `<div style="margin-top:10px;"><strong>Observaciones:</strong> ${inv.notes}</div>` : ''}
    </body></html>`
    return html
  }

  const printInvoice = (inv) => {
    const html = buildInvoiceHtml(inv)
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.onload = () => win.print()
  }

  useEffect(() => {
    load()
  }, [])

  const addLine = () => setLines((s) => [...s, { productId: '', productName: '', saleType: 'detal', price: 0, units: 1 }])
  const removeLine = (idx) => setLines((s) => s.filter((_, i) => i !== idx))

  const onChangeProduct = (idx, val) => {
    const opt = productOptions.find((o) => o.value === val)
    setLines((s) => s.map((l, i) => (i === idx ? { ...l, productId: val, productName: opt?.label || '', price: opt?.price || 0 } : l)))
  }

  const onChangeUnits = (idx, val) => setLines((s) => s.map((l, i) => (i === idx ? { ...l, units: val ?? 1 } : l)))
  const onChangePrice = (idx, val) => setLines((s) => s.map((l, i) => (i === idx ? { ...l, price: val ?? 0 } : l)))
  const onChangeSaleType = (idx, val) => setLines((s) => s.map((l, i) => (i === idx ? { ...l, saleType: val } : l)))

  const save = async () => {
    if (!lines.length || lines.some((l) => !l.productId || !Number(l.units))) {
      toast.current?.show({ severity: 'warn', summary: 'Validación', detail: 'Agrega al menos 1 línea válida' })
      return
    }
    setSaving(true)
    try {
      let id = editingId
      const payload = {
        customerName: customer.name,
        customerId: customer.id,
        customerEmail: customer.email || '',
        customerDocId: selectedCustomerId || null,
        items: lines.map((l) => ({ ...l, total: Number(l.units || 0) * Number(l.price || 0) })),
        subtotal: totals.subtotal,
        total: totals.total,
        notes,
        userId: user?.uid || null,
        userEmail: user?.email || null,
      }

      if (editingId) {
        await updateInvoice(editingId, payload)
        // Calcular ajustes de stock vs original
        const sumBy = (arr) => arr.reduce((m, it) => {
          const k = it.productId
          m[k] = (m[k] || 0) + Number(it.units || 0)
          return m
        }, {})
        const oldMap = sumBy(originalItems)
        const newMap = sumBy(lines)
        const ids = Array.from(new Set([...Object.keys(oldMap), ...Object.keys(newMap)]))
        for (const pid of ids) {
          const oldUnits = Number(oldMap[pid] || 0)
          const newUnits = Number(newMap[pid] || 0)
          const diff = newUnits - oldUnits
          if (diff > 0) {
            // Necesitamos más salidas
            const refLine = lines.find((l) => l.productId === pid) || {}
            await addMovement({
              productId: pid,
              type: 'out',
              units: diff,
              saleType: refLine.saleType || 'detal',
              priceAtSale: Number(refLine.price || 0),
              note: `Ajuste Factura ${editingId}`,
              userId: user?.uid || null,
              userEmail: user?.email || null,
              invoiceId: editingId,
            })
          } else if (diff < 0) {
            // Devolver al stock (-diff) como entrada sin afectar costo promedio
            await addMovement({
              productId: pid,
              type: 'in',
              units: -diff,
              costAtEntry: 0,
              note: `Ajuste Factura ${editingId}`,
              userId: user?.uid || null,
              userEmail: user?.email || null,
              invoiceId: editingId,
            })
          }
        }
        toast.current?.show({ severity: 'success', summary: 'Factura actualizada', detail: `#${editingId}` })
      } else {
        // Crear nueva
        const number = await nextInvoiceNumber()
        payload.number = number
        id = await createInvoice(payload)
        for (const l of lines) {
          await addMovement({
            productId: l.productId,
            type: 'out',
            units: Number(l.units || 0),
            saleType: l.saleType || 'detal',
            priceAtSale: Number(l.price || 0),
            note: `Factura ${id}`,
            userId: user?.uid || null,
            userEmail: user?.email || null,
            invoiceId: id,
          })
        }
        toast.current?.show({ severity: 'success', summary: 'Factura creada', detail: `#${id}` })
      }
      // limpiar
      setLines([])
      setCustomer({ name: '', id: '', email: '' })
      setNotes('')
      setEditingId(null)
      setOriginalItems([])
      await load()
    } catch (e) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: e?.message || 'No se pudo guardar' })
    } finally {
      setSaving(false)
    }
  }

  const editInvoice = (inv) => {
    setEditingId(inv.id)
    setCustomer({ name: inv.customerName || '', id: inv.customerId || '', email: inv.customerEmail || '' })
    setSelectedCustomerId(inv.customerDocId || null)
    setNotes(inv.notes || '')
    const items = Array.isArray(inv.items) ? inv.items : []
    setLines(items.map((it) => ({ productId: it.productId, productName: it.productName || '', saleType: it.saleType || 'detal', price: Number(it.price || 0), units: Number(it.units || 1) })))
    setOriginalItems(items)
    toast.current?.show({ severity: 'info', summary: 'Editando factura', detail: `#${inv.id}` })
  }

  const removeInvoice = async (inv) => {
    // Restituir stock de todas las líneas
    try {
      await deleteInvoice(inv.id)
      const items = Array.isArray(inv.items) ? inv.items : []
      for (const it of items) {
        await addMovement({
          productId: it.productId,
          type: 'in',
          units: Number(it.units || 0),
          costAtEntry: 0,
          note: `Anulación Factura ${inv.id}`,
          userId: user?.uid || null,
          userEmail: user?.email || null,
          invoiceId: inv.id,
        })
      }
      toast.current?.show({ severity: 'success', summary: 'Factura eliminada', detail: `#${inv.id}` })
      await load()
    } catch (e) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: e?.message || 'No se pudo eliminar' })
    }
  }

  return (
    <div className="p-3">
      <Toast ref={toast} />
      <h2 className="mb-2">Facturación</h2>

      <div className="card p-fluid mb-3">
        <div className="formgrid grid">
          <div className="field col-12">
            <div className="flex justify-content-between align-items-center">
              <label className="text-sm">Cliente</label>
              <Button label="Nuevo cliente" icon="pi pi-user-plus" size="small" onClick={openNewCustomer} outlined />
            </div>
            <Dropdown value={selectedCustomerId} options={customerOptions} onChange={(e) => onSelectCustomer(e.value)} placeholder="Buscar cliente..." filter showClear />
          </div>
          <div className="field col-12 md:col-4">
            <label className="text-sm">Nombre</label>
            <InputText value={customer.name} onChange={(e) => setCustomer((s) => ({ ...s, name: e.target.value }))} placeholder="Nombre del cliente" />
          </div>
          <div className="field col-12 md:col-4">
            <label className="text-sm">Documento/NIT</label>
            <InputText value={customer.id} onChange={(e) => setCustomer((s) => ({ ...s, id: e.target.value }))} placeholder="CC / NIT" />
          </div>
          <div className="field col-12 md:col-4">
            <label className="text-sm">Correo del cliente</label>
            <InputText value={customer.email} onChange={(e) => setCustomer((s) => ({ ...s, email: e.target.value }))} placeholder="email@cliente.com" />
          </div>
        </div>
      </div>

      <div className="card p-fluid mb-3">
        <div className="flex justify-content-between align-items-center mb-2">
          <h3 className="m-0">Productos</h3>
          <div className="flex align-items-center gap-2">
            <Dropdown value={selectedCategory} options={categoryOptions} onChange={(e) => setSelectedCategory(e.value ?? '')} placeholder="Todas las categorías" showClear />
            <Button label="Agregar línea" icon="pi pi-plus" onClick={addLine} outlined />
          </div>
        </div>

        {lines.length === 0 && <div className="text-600">No hay líneas. Agrega productos.</div>}

        {lines.map((l, idx) => (
          <div className="formgrid grid align-items-end" key={idx}>
            <div className="field col-12 md:col-5">
              <label className="text-sm">Producto</label>
              <Dropdown value={l.productId} options={productOptions} onChange={(e) => onChangeProduct(idx, e.value)} placeholder="Selecciona" filter />
            </div>
            <div className="field col-6 md:col-2">
              <label className="text-sm">Tipo</label>
              <Dropdown
                value={l.saleType}
                options={[{ label: 'Detal', value: 'detal' }, { label: 'Mayor', value: 'mayor' }]}
                onChange={(e) => onChangeSaleType(idx, e.value)}
              />
            </div>
            <div className="field col-6 md:col-2">
              <label className="text-sm">Unidades</label>
              <InputNumber value={l.units} onValueChange={(e) => onChangeUnits(idx, e.value)} min={1} />
            </div>
            <div className="field col-6 md:col-2">
              <label className="text-sm">Precio</label>
              <InputNumber
                value={l.price}
                onValueChange={(e) => onChangePrice(idx, e.value)}
                mode="currency"
                currency="COP"
                locale="es-CO"
                minFractionDigits={0}
                maxFractionDigits={0}
              />
            </div>
            <div className="field col-6 md:col-1">
              <Button icon="pi pi-trash" severity="danger" text onClick={() => removeLine(idx)} />
            </div>
          </div>
        ))}
      </div>

      <div className="card p-fluid mb-3">
        <div className="formgrid grid">
          <div className="field col-12">
            <label className="text-sm">Observaciones</label>
            <InputText value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
          </div>
        </div>
      </div>

      <div className="flex justify-content-end gap-4 align-items-center mb-3">
        <div>Subtotal: <strong>{formatCOP(totals.subtotal)}</strong></div>
        <div>Total: <strong>{formatCOP(totals.total)}</strong></div>
        <Button label={saving ? 'Guardando...' : 'Guardar factura'} onClick={save} loading={saving} />
      </div>

      <h3 className="mt-4">Historial</h3>
      <DataTable value={invoices} loading={loading} paginator rows={5} size="small" emptyMessage="Sin facturas">
        <Column field="number" header="N°" body={(r) => (r.number ? String(r.number).padStart(6,'0') : '—')} sortable />
        <Column field="createdAt" header="Fecha" body={(r) => new Date(r.createdAt).toLocaleString('es-CO')} sortable />
        <Column field="customerName" header="Cliente" sortable />
        <Column field="total" header="Total" body={(r) => formatCOP(r.total)} sortable />
        <Column field="userEmail" header="Vendedor" sortable />
        <Column header="Acciones" body={(r) => (
          <div className="flex gap-2">
            <Button icon="pi pi-pencil" rounded text onClick={() => editInvoice(r)} />
            <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => removeInvoice(r)} />
            <Button icon="pi pi-file-pdf" rounded text severity="help" onClick={() => printInvoice(r)} />
            <Button icon="pi pi-envelope" rounded text severity="success" onClick={() => sendInvoiceEmail(r)} />
          </div>
        )} />
      </DataTable>

      <Dialog
        header="Nuevo cliente"
        visible={customerDialog}
        onHide={() => setCustomerDialog(false)}
        style={{ width: '520px' }}
        footer={(
          <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" severity="secondary" onClick={() => setCustomerDialog(false)} outlined />
            <Button label={savingCustomer ? 'Guardando...' : 'Guardar'} onClick={saveNewCustomer} loading={savingCustomer} />
          </div>
        )}
      >
        <div className="p-fluid flex flex-column gap-3">
          <div className="field">
            <label className="text-sm">Nombre</label>
            <InputText value={newCustomer.name} onChange={(e) => setNewCustomer((s) => ({ ...s, name: e.target.value }))} />
          </div>
          <div className="field">
            <label className="text-sm">Documento/NIT</label>
            <InputText value={newCustomer.document} onChange={(e) => setNewCustomer((s) => ({ ...s, document: e.target.value }))} />
          </div>
          <div className="field">
            <label className="text-sm">Correo</label>
            <InputText value={newCustomer.email} onChange={(e) => setNewCustomer((s) => ({ ...s, email: e.target.value }))} />
          </div>
          <div className="field">
            <label className="text-sm">Teléfono</label>
            <InputText value={newCustomer.phone} onChange={(e) => setNewCustomer((s) => ({ ...s, phone: e.target.value }))} />
          </div>
        </div>
      </Dialog>
    </div>
  )
}
