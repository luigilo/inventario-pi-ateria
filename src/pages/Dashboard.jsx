import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { logout, user, role, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;

  return (
    <>
      <div className="p-3">
        <div className="flex align-items-center justify-content-end mb-3">
          <div className="flex align-items-center gap-2">
            <span className="text-500 text-sm">{user?.email}</span>
            <Button label="Salir" icon="pi pi-sign-out" onClick={logout} outlined severity="secondary" size="small" />
          </div>
        </div>
      </div>

      <div className="surface-0 text-center">
        <div className="mb-3 font-bold text-3xl">
          <span className="text-900">Bienvenid@, </span>
          <span className="text-blue-600">Inventario Happy Happy Piñateria</span>
        </div>
        <div className="text-700 mb-3">Gestiona productos, stock y ventas</div>
        <div className="grid">
          {(role === "admin"
            ? [
                { title: "Stock", sub: "Entradas y salidas", to: "/stock", icon: "pi-sort-amount-up" },
                { title: "Productos", sub: "Gestión de productos", to: "/productos", icon: "pi-box" },
                { title: "Proveedores", sub: "Tus proveedores", to: "/proveedores", icon: "pi-briefcase" },
                { title: "Reportes", sub: "Ventas y exportación", to: "/reportes", icon: "pi-file" },
                { title: "Usuarios", sub: "Roles y permisos", to: "/usuarios", icon: "pi-users" },
                { title: "Configuración", sub: "Parámetros de tienda", to: "/configuracion", icon: "pi-cog" },
              ]
            : [{ title: "Stock", sub: "Registrar ventas", to: "/stock", icon: "pi-sort-amount-up" }]
          ).map((c) => (
            <div className="col-12 md:col-4 mb-4 px-5" key={c.to}>
              <button
                type="button"
                onClick={() => navigate(c.to)}
                className="w-full surface-card border-1 border-200 p-4 text-left hover:surface-50 transition-duration-150"
                style={{ borderRadius: "10px" }}>
                <span className="p-3 shadow-2 mb-3 inline-block" style={{ borderRadius: "10px" }}>
                  <i className={`pi ${c.icon} text-4xl text-blue-500`}></i>
                </span>
                <div className="text-900 text-xl mb-2 font-medium">{c.title}</div>
                <span className="text-700 line-height-3">{c.sub}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
