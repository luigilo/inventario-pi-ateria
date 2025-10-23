import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const rawMenu = [
  { label: "Dashboard", icon: "pi pi-home", to: "/", roles: ["admin", "vendedor"] },
  { label: "Productos", icon: "pi pi-box", to: "/productos", roles: ["admin"] },
  { label: "Stock", icon: "pi pi-sort-amount-up", to: "/stock", roles: ["admin", "vendedor"] },
  { label: "Facturación", icon: "pi pi-credit-card", to: "/facturacion", roles: ["admin", "vendedor"] },
  { label: "Categorías", icon: "pi pi-tags", to: "/categorias", roles: ["admin"] },
  { label: "Clientes", icon: "pi pi-id-card", to: "/clientes", roles: ["admin"] },
  { label: "Proveedores", icon: "pi pi-briefcase", to: "/proveedores", roles: ["admin"] },
  { label: "Usuarios", icon: "pi pi-users", to: "/usuarios", roles: ["admin"] },
  { label: "Reportes", icon: "pi pi-file", to: "/reportes", roles: ["admin"] },
];

export default function AppSidebar({ visible, onHide }) {
  const location = useLocation();
  const { role } = useAuth();
  const menu = rawMenu.filter((item) => !item.roles || item.roles.includes(role));
  const active = (path) => (location.pathname === path ? "active-route" : "");

  return (
    <aside className="layout-sidebar" style={{ transform: visible ? "translateX(0)" : undefined }}>
      <ul className="layout-menu">
        <li className="layout-root-menuitem">
          <span className="layout-menuitem-root-text">Navegación</span>
        </li>
        <ul>
          {menu.map((item) => (
            <li key={item.to}>
              <Link to={item.to} onClick={onHide} className={active(item.to)}>
                <i className={`layout-menuitem-icon ${item.icon}`} />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </ul>
    </aside>
  );
}
