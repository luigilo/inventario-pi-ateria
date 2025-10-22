import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { logout, user } = useAuth()

  return (
    <div className="p-3">
      <div className="flex align-items-center justify-content-between mb-3">
        <h2 className="m-0">Dashboard</h2>
        <div className="flex align-items-center gap-2">
          <span className="text-500 text-sm">{user?.email}</span>
          <Button label="Salir" icon="pi pi-sign-out" onClick={logout} outlined severity="secondary" size="small" />
        </div>
      </div>

      <div className="grid">
        <div className="col-12 md:col-6 lg:col-3">
          <Card title="Productos" subTitle="Gestión de productos">
            <Link to="/productos" className="p-button p-component p-button-text">Ir a Productos</Link>
          </Card>
        </div>
        <div className="col-12 md:col-6 lg:col-3">
          <Card title="Stock" subTitle="Entradas y salidas">
            <Link to="/stock" className="p-button p-component p-button-text">Ir a Stock</Link>
          </Card>
        </div>
        <div className="col-12 md:col-6 lg:col-3">
          <Card title="Categorías" subTitle="Clasificación">
            <Link to="/categorias" className="p-button p-component p-button-text">Ir a Categorías</Link>
          </Card>
        </div>
        <div className="col-12 md:col-6 lg:col-3">
          <Card title="Proveedores" subTitle="Tus proveedores">
            <Link to="/proveedores" className="p-button p-component p-button-text">Ir a Proveedores</Link>
          </Card>
        </div>
        <div className="col-12 md:col-6 lg:col-3">
          <Card title="Reportes" subTitle="Exportar CSV">
            <Link to="/reportes" className="p-button p-component p-button-text">Ir a Reportes</Link>
          </Card>
        </div>
        <div className="col-12 md:col-6 lg:col-3">
          <Card title="Configuración" subTitle="Tienda y parámetros">
            <Link to="/configuracion" className="p-button p-component p-button-text">Ir a Configuración</Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
