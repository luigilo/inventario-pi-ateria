import { Link } from "react-router-dom";

export default function AppTopbar({ onMenuToggle }) {
  return (
    <div className="layout-topbar">
      <Link to="/" className="layout-topbar-logo">
        <img src="/vite.svg" alt="logo" />
        <span>Inventario</span>
      </Link>
      <button type="button" className="layout-topbar-button layout-menu-button p-link" onClick={onMenuToggle} aria-label="Menu">
        <i className="pi pi-bars" />
      </button>
      <ul className="layout-topbar-menu">
        <li>
          <Link to="/configuracion" className="layout-topbar-button">
            <i className="pi pi-cog" />
            <span>Settings</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
