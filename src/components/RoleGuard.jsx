import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RoleGuard({ allow = [], children }) {
  const { user, loading, role } = useAuth()

  if (loading) return <div className="p-3">Cargando...</div>
  if (!user) return <Navigate to="/login" replace />
  if (allow.length && !allow.includes(role)) return <Navigate to="/" replace />
  return children
}
