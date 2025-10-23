import { useEffect, useMemo, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toolbar } from "primereact/toolbar";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { listSuppliers, createSupplier, updateSupplier, deleteSupplier } from "../services/suppliers";

export default function Proveedores() {
  const toast = useRef(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const empty = useMemo(() => ({ id: null, name: "", contact: "", description: "" }), []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await listSuppliers();
      setItems(data);
    } catch (err) {
      toast.current?.show({ severity: "error", summary: "Error", detail: err?.message || "No se pudo cargar proveedores" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing({ ...empty });
    setDialogVisible(true);
  };

  const openEdit = (row) => {
    setEditing({ ...row });
    setDialogVisible(true);
  };

  const onDelete = (row) => {
    confirmDialog({
      message: `¿Eliminar proveedor "${row.name}"?`,
      header: "Confirmar",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await deleteSupplier(row.id);
          setItems((prev) => prev.filter((s) => s.id !== row.id));
          toast.current?.show({ severity: "success", summary: "Eliminado", detail: "Proveedor eliminado" });
        } catch (err) {
          toast.current?.show({ severity: "error", summary: "Error", detail: err?.message || "No se pudo eliminar" });
        }
      },
    });
  };

  const save = async () => {
    if (!editing?.name) {
      toast.current?.show({ severity: "warn", summary: "Validación", detail: "Nombre es requerido" });
      return;
    }
    setSaving(true);
    try {
      if (editing.id) {
        await updateSupplier(editing.id, { name: editing.name, contact: editing.contact, description: editing.description });
        setItems((prev) => prev.map((s) => (s.id === editing.id ? { ...s, ...editing } : s)));
        toast.current?.show({ severity: "success", summary: "Actualizado", detail: "Proveedor actualizado" });
      } else {
        const base = { ...editing };
        delete base.id;
        const id = await createSupplier(base);
        setItems((prev) => [{ id, ...base }, ...prev]);
        toast.current?.show({ severity: "success", summary: "Creado", detail: "Proveedor creado" });
      }
      setDialogVisible(false);
    } catch (err) {
      toast.current?.show({ severity: "error", summary: "Error", detail: err?.message || "No se pudo guardar" });
    } finally {
      setSaving(false);
    }
  };

  const leftToolbar = (
    <div className="flex align-items-center gap-2">
      <Button label="Nuevo" icon="pi pi-plus" onClick={openNew} />
      <Button label="Refrescar" icon="pi pi-refresh" onClick={load} outlined />
    </div>
  );

  const rightToolbar = (
    <span className="p-input-icon-left">
      <i className="pi pi-search" />
      <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Buscar..." />
    </span>
  );

  const header = <Toolbar left={leftToolbar} right={rightToolbar} className="mb-3" />;

  const actionsBody = (row) => (
    <div className="flex gap-2">
      <Button icon="pi pi-pencil" rounded text onClick={() => openEdit(row)} />
      <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => onDelete(row)} />
    </div>
  );

  return (
    <div className="p-3">
      <Toast ref={toast} />
      <ConfirmDialog />
      <h2 className="mb-2">Proveedores</h2>
      <DataTable
        value={items}
        loading={loading}
        header={header}
        paginator
        rows={10}
        removableSort
        filterDisplay="menu"
        globalFilterFields={["name", "contact", "description"]}
        globalFilter={globalFilter}
        emptyMessage="Sin proveedores"
        size="small"
      >
        <Column field="name" header="Nombre" sortable />
        <Column field="contact" header="Contacto" sortable />
        <Column field="description" header="Descripción" />
        <Column header="Acciones" body={actionsBody} style={{ width: "8rem" }} />
      </DataTable>

      <Dialog
        header={editing?.id ? "Editar proveedor" : "Nuevo proveedor"}
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        style={{ width: "520px" }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" severity="secondary" onClick={() => setDialogVisible(false)} outlined />
            <Button label={saving ? "Guardando..." : "Guardar"} onClick={save} loading={saving} />
          </div>
        }
      >
        {editing && (
          <div className="card p-fluid flex flex-column gap-3">
            <div className="field">
              <label className="text-sm">Nombre</label>
              <InputText value={editing.name} onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))} required />
            </div>
            <div className="field">
              <label className="text-sm">Contacto</label>
              <InputText value={editing.contact} onChange={(e) => setEditing((s) => ({ ...s, contact: e.target.value }))} />
            </div>
            <div className="field">
              <label className="text-sm">Descripción</label>
              <InputText value={editing.description} onChange={(e) => setEditing((s) => ({ ...s, description: e.target.value }))} />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
