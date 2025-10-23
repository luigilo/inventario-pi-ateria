 import { useEffect, useMemo, useRef, useState } from 'react'
 import { DataTable } from 'primereact/datatable'
 import { Column } from 'primereact/column'
 import { Toolbar } from 'primereact/toolbar'
 import { Dialog } from 'primereact/dialog'
 import { InputText } from 'primereact/inputtext'
 import { InputNumber } from 'primereact/inputnumber'
 import { Dropdown } from 'primereact/dropdown'
 import { Button } from 'primereact/button'
 import { Toast } from 'primereact/toast'
 import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
 import { listProducts, createProduct, updateProduct, deleteProduct } from '../services/products'
 import { uploadProductImage } from '../services/storage'

 const CATEGORIES = ['Piñatas', 'Globos', 'Disfraces', 'Dulces', 'Decoración']

 export default function Productos() {
   const toast = useRef(null)
   const [loading, setLoading] = useState(true)
   const [items, setItems] = useState([])
   const [globalFilter, setGlobalFilter] = useState('')
   const [dialogVisible, setDialogVisible] = useState(false)
   const [editing, setEditing] = useState(null)
   const [imageFile, setImageFile] = useState(null)
   const [saving, setSaving] = useState(false)

   const emptyProduct = useMemo(
     () => ({ id: null, name: '', category: '', price: 0, quantity: 0, supplier: '', description: '', imageUrl: '' }),
     [],
   )

  const load = async () => {
    try {
      setLoading(true)
      const data = await listProducts()
      setItems(data)
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar productos' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openNew = () => {
    setEditing({ ...emptyProduct })
    setImageFile(null)
    setDialogVisible(true)
  }

  const openEdit = (row) => {
    setEditing({ ...row })
    setImageFile(null)
    setDialogVisible(true)
  }

  const onDelete = (row) => {
    confirmDialog({
      message: `¿Eliminar "${row.name}"?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await deleteProduct(row.id)
          setItems((prev) => prev.filter((p) => p.id !== row.id))
          toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Producto eliminado' })
        } catch {
          toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' })
        }
      },
    })
  }

  const save = async () => {
    if (!editing?.name) {
      toast.current?.show({ severity: 'warn', summary: 'Validación', detail: 'Nombre es requerido' })
      return
    }
    setSaving(true)
    try {
      let imageUrl = editing.imageUrl || ''
      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile, editing.id || 'new')
      }
      const payload = { ...editing, imageUrl }
      if (editing.id) {
        await updateProduct(editing.id, payload)
        setItems((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...payload } : p)))
        toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: 'Producto actualizado' })
      } else {
        const id = await createProduct(payload)
        setItems((prev) => [{ id, ...payload }, ...prev])
        toast.current?.show({ severity: 'success', summary: 'Creado', detail: 'Producto creado' })
      }
      setDialogVisible(false)
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' })
    } finally {
      setSaving(false)
    }
  }

  const leftToolbar = (
    <div className="flex align-items-center gap-2">
      <Button label="Nuevo" icon="pi pi-plus" onClick={openNew} />
      <Button label="Refrescar" icon="pi pi-refresh" onClick={load} outlined />
    </div>
  )

  const rightToolbar = (
    <span className="p-input-icon-left">
      <i className="pi pi-search" />
      <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Buscar..." />
    </span>
  )

  const imageBody = (row) =>
    row.imageUrl ? (
      <img src={row.imageUrl} alt={row.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
    ) : (
      <span className="text-500">—</span>
    )

  const actionsBody = (row) => (
    <div className="flex gap-2">
      <Button icon="pi pi-pencil" rounded text onClick={() => openEdit(row)} />
      <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => onDelete(row)} />
    </div>
  )

  const header = (
    <Toolbar left={leftToolbar} right={rightToolbar} className="mb-3" />
  )

  const onHide = () => {
    setDialogVisible(false)
  }

  return (
    <div className="p-3">
      <Toast ref={toast} />
      <ConfirmDialog />
      <h2 className="mb-2">Productos</h2>
      <DataTable
        value={items}
        loading={loading}
        header={header}
        paginator
        rows={10}
        removableSort
        filterDisplay="menu"
        globalFilterFields={[
          'name',
          'category',
          'supplier',
          'description',
        ]}
        globalFilter={globalFilter}
        emptyMessage="Sin productos"
        size="small"
      >
        <Column field="imageUrl" header="Imagen" body={imageBody} style={{ width: '8rem' }} />
        <Column field="name" header="Nombre" sortable />
        <Column field="category" header="Categoría" sortable />
        <Column field="price" header="Precio" sortable body={(r) => `$${Number(r.price || 0).toFixed(2)}`} />
        <Column field="quantity" header="Cantidad" sortable />
        <Column field="supplier" header="Proveedor" sortable />
        <Column header="Acciones" body={actionsBody} style={{ width: '8rem' }} />
      </DataTable>

      <Dialog
        header={editing?.id ? 'Editar producto' : 'Nuevo producto'}
        visible={dialogVisible}
        onHide={onHide}
        style={{ width: '520px' }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" severity="secondary" onClick={onHide} outlined />
            <Button label={saving ? 'Guardando...' : 'Guardar'} onClick={save} loading={saving} />
          </div>
        }
      >
        {editing && (
          <div className="flex flex-column gap-3">
            <div className="flex gap-3">
              <div style={{ width: 96 }}>
                {editing.imageUrl ? (
                  <img src={editing.imageUrl} alt="preview" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <div className="border-1 border-300 border-round" style={{ width: 96, height: 96 }} />
                )}
              </div>
              <div className="flex flex-column gap-2">
                <label className="text-sm">Imagen</label>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              </div>
            </div>
            <div className="grid">
              <div className="col-12">
                <label className="text-sm">Nombre</label>
                <InputText value={editing.name} onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))} required />
              </div>
              <div className="col-12 md:col-6">
                <label className="text-sm">Categoría</label>
                <Dropdown
                  value={editing.category}
                  options={CATEGORIES}
                  onChange={(e) => setEditing((s) => ({ ...s, category: e.value }))}
                  placeholder="Selecciona"
                />
              </div>
              <div className="col-6 md:col-3">
                <label className="text-sm">Precio</label>
                <InputNumber
                  value={editing.price}
                  onValueChange={(e) => setEditing((s) => ({ ...s, price: e.value ?? 0 }))}
                  mode="currency"
                  currency="USD"
                  locale="es-CO"
                />
              </div>
              <div className="col-6 md:col-3">
                <label className="text-sm">Cantidad</label>
                <InputNumber value={editing.quantity} onValueChange={(e) => setEditing((s) => ({ ...s, quantity: e.value ?? 0 }))} />
              </div>
              <div className="col-12 md:col-6">
                <label className="text-sm">Proveedor</label>
                <InputText value={editing.supplier} onChange={(e) => setEditing((s) => ({ ...s, supplier: e.target.value }))} />
              </div>
              <div className="col-12">
                <label className="text-sm">Descripción</label>
                <InputText value={editing.description} onChange={(e) => setEditing((s) => ({ ...s, description: e.target.value }))} />
              </div>
            </div>
          </div>
        )}
      </Dialog>
  </div>
  )
}
