import { useEffect, useMemo, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toolbar } from "primereact/toolbar";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { listUsers, upsertUserDoc, updateUserDoc, deleteUserDoc } from "../services/users";

export default function Usuarios() {
  const toast = useRef(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const empty = useMemo(() => ({ id: "", email: "", displayName: "", role: "vendedor" }), []);
  const roleOptions = [
    { label: "Administrador", value: "admin" },
    { label: "Vendedor", value: "vendedor" },
  ];

  const load = async () => {
    try {
      setLoading(true);
      const data = await listUsers();
      console.log("users count:", data.length, data);
      setItems(data);
    } catch (err) {
      toast.current?.show({ severity: "error", summary: "Error", detail: err?.message || "No se pudo cargar usuarios" });
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
    setEditing({ id: row.id, email: row.email || "", displayName: row.displayName || "", role: row.role || "vendedor" });
    setDialogVisible(true);
  };

  const onDelete = (row) => {
    confirmDialog({
      message: `¿Eliminar usuario "${row.email || row.id}"?`,
      header: "Confirmar",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await deleteUserDoc(row.id);
          setItems((prev) => prev.filter((u) => u.id !== row.id));
          toast.current?.show({ severity: "success", summary: "Eliminado", detail: "Usuario eliminado" });
        } catch (err) {
          toast.current?.show({ severity: "error", summary: "Error", detail: err?.message || "No se pudo eliminar" });
        }
      },
    });
  };

  const save = async () => {
    if (!editing?.role) {
      toast.current?.show({ severity: "warn", summary: "Validación", detail: "El rol es requerido" });
      return;
    }
    if (!editing?.id) {
      toast.current?.show({ severity: "warn", summary: "Validación", detail: "Debes ingresar el UID (id) del usuario de Authentication" });
      return;
    }
    setSaving(true);
    try {
      // upsert por UID: si existe actualiza; si no existe crea
      await upsertUserDoc(editing.id, {
        email: editing.email || "",
        displayName: editing.displayName || "",
        role: editing.role,
      });
      await load();
      setDialogVisible(false);
      toast.current?.show({ severity: "success", summary: "Guardado", detail: "Usuario actualizado" });
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
      <h2 className="mb-2">Usuarios</h2>
      <p className="text-600 mb-3">
        Esta página administra los documentos en <code>users/{"{uid}"}</code> con campo <code>role</code>. Para crear cuentas, usa Firebase
        Authentication. Aquí asignas/actualizas rol por UID.
      </p>
      <DataTable
        value={items}
        loading={loading}
        header={header}
        paginator
        rows={10}
        removableSort
        filterDisplay="menu"
        globalFilterFields={["id", "email", "displayName", "role"]}
        globalFilter={globalFilter}
        emptyMessage="Sin usuarios"
        size="small">
        <Column field="id" header="UID" sortable />
        <Column field="email" header="Email" sortable />
        <Column field="displayName" header="Nombre" sortable />
        <Column field="role" header="Rol" sortable body={(r) => (r.role === "admin" ? "Administrador" : "Vendedor")} />
        <Column header="Acciones" body={actionsBody} style={{ width: "8rem" }} />
      </DataTable>

      <Dialog
        header={editing?.id ? "Editar usuario" : "Nuevo usuario"}
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        style={{ width: "520px" }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" severity="secondary" onClick={() => setDialogVisible(false)} outlined />
            <Button label={saving ? "Guardando..." : "Guardar"} onClick={save} loading={saving} />
          </div>
        }>
        {editing && (
          <div className="card p-fluid flex flex-column gap-3">
            <div className="field">
              <label className="text-sm">UID (Authentication)</label>
              <InputText value={editing.id} onChange={(e) => setEditing((s) => ({ ...s, id: e.target.value }))} required />
            </div>
            <div className="field">
              <label className="text-sm">Email</label>
              <InputText value={editing.email} onChange={(e) => setEditing((s) => ({ ...s, email: e.target.value }))} />
            </div>
            <div className="field">
              <label className="text-sm">Nombre</label>
              <InputText value={editing.displayName} onChange={(e) => setEditing((s) => ({ ...s, displayName: e.target.value }))} />
            </div>
            <div className="field">
              <label className="text-sm">Rol</label>
              <Dropdown value={editing.role} options={roleOptions} onChange={(e) => setEditing((s) => ({ ...s, role: e.value }))} />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
