import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RoleRoute({ children, allow = [] }) {
  const { user, loading, role } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (allow.length && !allow.includes(role)) return <Navigate to="/" replace />
  return children
}
