import { useEffect, useMemo, useRef, useState } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Toolbar } from 'primereact/toolbar'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { Button } from 'primereact/button'
import { Toast } from 'primereact/toast'
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'
import { listCategories, createCategory, updateCategory, deleteCategory } from '../services/categories'

export default function Categorias() {
  const toast = useRef(null)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [dialogVisible, setDialogVisible] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')

  const empty = useMemo(() => ({ id: null, name: '', description: '' }), [])

  const load = async () => {
    try {
      setLoading(true)
      const data = await listCategories()
      setItems(data)
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: err?.message || 'No se pudieron cargar categorías' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openNew = () => {
    setEditing({ ...empty })
    setDialogVisible(true)
  }

  const openEdit = (row) => {
    setEditing({ id: row.id, name: row.name || '', description: row.description || '' })
    setDialogVisible(true)
  }

  const onDelete = (row) => {
    confirmDialog({
      message: `¿Eliminar la categoría "${row.name}"?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await deleteCategory(row.id)
          setItems((prev) => prev.filter((c) => c.id !== row.id))
          toast.current?.show({ severity: 'success', summary: 'Eliminada', detail: 'Categoría eliminada' })
        } catch (err) {
          toast.current?.show({ severity: 'error', summary: 'Error', detail: err?.message || 'No se pudo eliminar' })
        }
      },
    })
  }

  const save = async () => {
    if (!editing?.name?.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Validación', detail: 'El nombre es requerido' })
      return
    }
    setSaving(true)
    try {
      if (editing.id) {
        await updateCategory(editing.id, { name: editing.name.trim(), description: editing.description?.trim() || '' })
        setItems((prev) => prev.map((c) => (c.id === editing.id ? { ...c, name: editing.name.trim(), description: editing.description?.trim() || '' } : c)))
        toast.current?.show({ severity: 'success', summary: 'Actualizada', detail: 'Categoría actualizada' })
      } else {
        const id = await createCategory({ name: editing.name.trim(), description: editing.description?.trim() || '' })
        setItems((prev) => [{ id, name: editing.name.trim(), description: editing.description?.trim() || '' }, ...prev])
        toast.current?.show({ severity: 'success', summary: 'Creada', detail: 'Categoría creada' })
      }
      setDialogVisible(false)
    } catch (err) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: err?.message || 'No se pudo guardar' })
    } finally {
      setSaving(false)
    }
  }

  const leftToolbar = (
    <div className="flex align-items-center gap-2">
      <Button label="Nueva" icon="pi pi-plus" onClick={openNew} />
      <Button label="Refrescar" icon="pi pi-refresh" onClick={load} outlined />
    </div>
  )

  const rightToolbar = (
    <span className="p-input-icon-left">
      <i className="pi pi-search" />
      <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Buscar..." />
    </span>
  )

  const header = <Toolbar left={leftToolbar} right={rightToolbar} className="mb-3" />

  const actionsBody = (row) => (
    <div className="flex gap-2">
      <Button icon="pi pi-pencil" rounded text onClick={() => openEdit(row)} />
      <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => onDelete(row)} />
    </div>
  )

  return (
    <div className="p-3">
      <Toast ref={toast} />
      <ConfirmDialog />
      <h2 className="mb-2">Categorías</h2>
      <DataTable
        value={items}
        loading={loading}
        header={header}
        paginator
        rows={10}
        removableSort
        filterDisplay="menu"
        globalFilter={globalFilter}
        globalFilterFields={["name", "description"]}
        emptyMessage="Sin categorías"
        size="small"
      >
        <Column field="name" header="Nombre" sortable />
        <Column field="description" header="Descripción" sortable />
        <Column header="Acciones" body={actionsBody} style={{ width: '8rem' }} />
      </DataTable>

      <Dialog
        header={editing?.id ? 'Editar categoría' : 'Nueva categoría'}
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        style={{ width: '520px' }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" severity="secondary" onClick={() => setDialogVisible(false)} outlined />
            <Button label={saving ? 'Guardando...' : 'Guardar'} onClick={save} loading={saving} />
          </div>
        }
      >
        {editing && (
          <div className="card p-fluid flex flex-column gap-3">
            <div className="field">
              <label className="text-sm">Nombre</label>
              <InputText value={editing.name} onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))} />
            </div>
            <div className="field">
              <label className="text-sm">Descripción</label>
              <InputText value={editing.description} onChange={(e) => setEditing((s) => ({ ...s, description: e.target.value }))} />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
 
