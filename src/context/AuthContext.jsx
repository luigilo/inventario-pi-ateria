 import { createContext, useContext, useEffect, useMemo, useState } from 'react'
 import { auth } from '../services/firebase'
 import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
 import { db } from '../services/firebase'
 import { doc, getDoc } from 'firebase/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid))
          const data = snap.exists() ? snap.data() : {}
          setRole(data.role || 'vendedor')
        } catch {
          setRole('vendedor')
        }
      } else {
        setRole('')
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const logout = async () => {
    await signOut(auth)
  }

  const value = useMemo(() => ({ user, loading, role, login, logout }), [user, loading, role])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
