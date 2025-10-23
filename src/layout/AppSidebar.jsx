import { Link, useLocation } from 'react-router-dom'

const menu = [
  { label: 'Dashboard', icon: 'pi pi-home', to: '/' },
  { label: 'Productos', icon: 'pi pi-box', to: '/productos' },
  { label: 'Stock', icon: 'pi pi-sort-amount-up', to: '/stock' },
  { label: 'Categorías', icon: 'pi pi-tags', to: '/categorias' },
  { label: 'Proveedores', icon: 'pi pi-briefcase', to: '/proveedores' },
  { label: 'Usuarios', icon: 'pi pi-users', to: '/usuarios' },
  { label: 'Reportes', icon: 'pi pi-file', to: '/reportes' },
  { label: 'Configuración', icon: 'pi pi-cog', to: '/configuracion' },
]

export default function AppSidebar({ visible, onHide }) {
  const location = useLocation()
  const active = (path) => (location.pathname === path ? 'active-route' : '')

  return (
    <aside className="layout-sidebar" style={{ transform: visible ? 'translateX(0)' : undefined }}>
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
  )
}
