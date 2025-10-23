import { useEffect, useMemo, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toolbar } from "primereact/toolbar";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { listProducts, createProduct, updateProduct, deleteProduct } from "../services/products";
import { listSuppliers } from "../services/suppliers";
import { uploadProductImage } from "../services/storage";

const CATEGORIES = ["Piñatas", "Globos", "Disfraces", "Dulces", "Decoración"];

export default function Productos() {
  const toast = useRef(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const fileInputRef = useRef(null);

  const emptyProduct = useMemo(
    () => ({ id: null, name: "", category: "", price: 0, cost: 0, quantity: 0, supplier: "", description: "", imageUrl: "" }),
    [],
  );

  const load = async () => {
    try {
      setLoading(true);
      const data = await listProducts();
      setItems(data);
    } catch (err) {
      toast.current?.show({ severity: "error", summary: "Error", detail: err?.message || "No se pudo cargar productos" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // cargar proveedores para el selector
    (async () => {
      try {
        const s = await listSuppliers();
        setSuppliers(s);
      } catch (e) {
        // opcional: ignorar
      }
    })();
  }, []);

  const openNew = () => {
    setEditing({ ...emptyProduct });
    setImageFile(null);
    setDialogVisible(true);
  };

  const openEdit = (row) => {
    // Ensure defaults for new fields if missing in existing records
    setEditing({ cost: 0, ...row });
    setImageFile(null);
    setDialogVisible(true);
  };

  // Build a local preview URL when user selects a new image
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [imageFile]);

  const onDelete = (row) => {
    confirmDialog({
      message: `¿Eliminar "${row.name}"?`,
      header: "Confirmar",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Eliminar",
      rejectLabel: "Cancelar",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await deleteProduct(row.id);
          setItems((prev) => prev.filter((p) => p.id !== row.id));
          toast.current?.show({ severity: "success", summary: "Eliminado", detail: "Producto eliminado" });
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
      // Si es edición
      if (editing.id) {
        let next = { ...editing };
        if (imageFile) {
          try {
            const url = await uploadProductImage(imageFile, editing.id);
            next.imageUrl = url;
          } catch (err) {
            toast.current?.show({
              severity: "warn",
              summary: "Imagen",
              detail: err?.message || "No se pudo subir la imagen. Se guarda sin cambios de imagen.",
            });
          }
        }
        // compute profit locally for immediate UI feedback
        next.profit = Number(next.price || 0) - Number(next.cost || 0);
        await updateProduct(editing.id, { ...next });
        setItems((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...next } : p)));
        toast.current?.show({ severity: "success", summary: "Actualizado", detail: "Producto actualizado" });
      } else {
        // Creación: primero crea el documento sin imageUrl
        const base = { ...editing };
        delete base.id;
        // No forzar imageUrl aquí; se añadirá luego
        const id = await createProduct({ ...base, imageUrl: "" });
        let final = { id, ...base, imageUrl: "" };
        final.profit = Number(final.price || 0) - Number(final.cost || 0);
        // Intentar subir imagen si existe
        if (imageFile) {
          try {
            const url = await uploadProductImage(imageFile, id);
            await updateProduct(id, { imageUrl: url });
            final.imageUrl = url;
          } catch (err) {
            toast.current?.show({ severity: "warn", summary: "Imagen", detail: err?.message || "Producto creado, pero la imagen no se pudo subir." });
          }
        }
        setItems((prev) => [final, ...prev]);
        toast.current?.show({ severity: "success", summary: "Creado", detail: "Producto creado" });
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

  const imageBody = (row) =>
    row.imageUrl ? (
      <img src={row.imageUrl} alt={row.name} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }} />
    ) : (
      <span className="text-500">—</span>
    );

  const actionsBody = (row) => (
    <div className="flex gap-2">
      <Button icon="pi pi-pencil" rounded text onClick={() => openEdit(row)} />
      <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => onDelete(row)} />
    </div>
  );

  const header = <Toolbar left={leftToolbar} right={rightToolbar} className="mb-3" />;

  const onHide = () => {
    setDialogVisible(false);
  };

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
        globalFilterFields={["name", "category", "supplier", "description"]}
        globalFilter={globalFilter}
        emptyMessage="Sin productos"
        size="small">
        <Column field="imageUrl" header="Imagen" body={imageBody} style={{ width: "8rem" }} />
        <Column field="name" header="Nombre" sortable />
        <Column field="category" header="Categoría" sortable />
        <Column
          field="price"
          header="Precio venta"
          sortable
          body={(r) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(r.price || 0))}
        />
        <Column
          field="cost"
          header="Costo compra"
          sortable
          body={(r) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(r.cost || 0))}
        />
        <Column
          field="profit"
          header="Ganancia"
          sortable
          body={(r) => {
            const profit = Number(
              Object.prototype.hasOwnProperty.call(r, 'profit')
                ? r.profit
                : Number(r.price || 0) - Number(r.cost || 0),
            );
            return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(profit);
          }}
        />
        <Column
          header="Margen %"
          sortable
          body={(r) => {
            const price = Number(r.price || 0);
            const cost = Number(r.cost || 0);
            if (!cost) return "—";
            const pct = ((price - cost) / cost) * 100;
            return `${pct.toFixed(0)}%`;
          }}
        />
        <Column field="quantity" header="Cantidad" sortable />
        <Column field="supplier" header="Proveedor" sortable />
        <Column header="Acciones" body={actionsBody} style={{ width: "8rem" }} />
      </DataTable>

      <Dialog
        header={editing?.id ? "Editar producto" : "Nuevo producto"}
        visible={dialogVisible}
        onHide={onHide}
        style={{ width: "520px" }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" severity="secondary" onClick={onHide} outlined />
            <Button label={saving ? "Guardando..." : "Guardar"} onClick={save} loading={saving} />
          </div>
        }>
        {editing && (
          <div className="flex flex-column gap-3">
            <div className="card p-fluid">
              <div className="flex gap-3">
                <div style={{ width: 96 }}>
                  {previewUrl || editing.imageUrl ? (
                    <img src={previewUrl || editing.imageUrl} alt="preview" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8 }} />
                  ) : (
                    <div className="border-1 border-300 border-round" style={{ width: 96, height: 96 }} />
                  )}
                </div>
                <div className="flex flex-column gap-2">
                  <label className="text-sm">Imagen</label>
                  <Button label="Seleccionar" icon="pi pi-folder-open" severity="secondary" onClick={() => fileInputRef.current?.click()} />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                  {imageFile && <small className="text-600">{imageFile.name}</small>}
                </div>
              </div>
              <div className="field">
                <label className="text-sm">Nombre</label>
                <InputText value={editing.name} onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))} required />
              </div>
              <div className="field">
                <label className="text-sm">Categoría</label>
                <Dropdown
                  value={editing.category}
                  options={CATEGORIES}
                  onChange={(e) => setEditing((s) => ({ ...s, category: e.value }))}
                  placeholder="Selecciona"
                />
              </div>
              <div className="formgrid grid">
                <div className="field col">
                  <label className="text-sm">Precio de venta</label>
                  <InputNumber
                    value={editing.price}
                    onValueChange={(e) => setEditing((s) => ({ ...s, price: e.value ?? 0 }))}
                    mode="currency"
                    currency="COP"
                    locale="es-CO"
                    minFractionDigits={0}
                    maxFractionDigits={0}
                  />
                </div>
                <div className="field col">
                  <label className="text-sm">Costo de compra</label>
                  <InputNumber
                    value={editing.cost}
                    onValueChange={(e) => setEditing((s) => ({ ...s, cost: e.value ?? 0 }))}
                    mode="currency"
                    currency="COP"
                    locale="es-CO"
                    minFractionDigits={0}
                    maxFractionDigits={0}
                  />
                </div>
              </div>
              <div className="formgrid grid">
                <div className="field col">
                  <label className="text-sm">Ganancia</label>
                  <div className="p-inputtext p-component" style={{ padding: '0.75rem' }}>
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                      Math.max(0, Number(editing.price || 0) - Number(editing.cost || 0)),
                    )}
                  </div>
                </div>
                <div className="field col">
                  <label className="text-sm">Margen %</label>
                  <div className="p-inputtext p-component" style={{ padding: '0.75rem' }}>
                    {Number(editing.cost || 0)
                      ? `${(((Number(editing.price || 0) - Number(editing.cost || 0)) / Number(editing.cost || 0)) * 100).toFixed(0)}%`
                      : '—'}
                  </div>
                </div>
              </div>
              <div className="field">
                <label className="text-sm">Cantidad</label>
                <InputNumber value={editing.quantity} onValueChange={(e) => setEditing((s) => ({ ...s, quantity: e.value ?? 0 }))} />
              </div>
              <div className="field">
                <label className="text-sm">Proveedor</label>
                <Dropdown
                  value={editing.supplier}
                  options={suppliers.map((s) => ({ label: s.name, value: s.name }))}
                  onChange={(e) => setEditing((s) => ({ ...s, supplier: e.value }))}
                  placeholder="Selecciona proveedor"
                  filter
                />
              </div>
              <div className="field">
                <label className="text-sm">Descripción</label>
                <InputText value={editing.description} onChange={(e) => setEditing((s) => ({ ...s, description: e.target.value }))} />
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
