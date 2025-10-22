import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (user) return <Navigate to="/" replace />

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err?.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex align-items-center justify-content-center min-h-screen p-3">
      <Card title="Inventario Piñatería" className="w-full" style={{ maxWidth: 420 }}>
        <form onSubmit={onSubmit} className="flex flex-column gap-3">
          <div className="flex flex-column gap-2">
            <label htmlFor="email">Correo</label>
            <InputText id="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="flex flex-column gap-2">
            <label htmlFor="password">Contraseña</label>
            <Password id="password" inputClassName="w-full" feedback={false} toggleMask value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <small className="p-error">{error}</small>}
          <Button type="submit" label={loading ? 'Ingresando...' : 'Ingresar'} loading={loading} className="mt-2" />
        </form>
      </Card>
    </div>
  )
}
