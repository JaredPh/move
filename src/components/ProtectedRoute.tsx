import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  console.log('ProtectedRoute - loading:', loading, 'user:', user)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    console.log('No user found, redirecting to login')
    return <Navigate to="/login" replace />
  }

  console.log('User authenticated, rendering protected content')
  return <>{children}</>
}

export default ProtectedRoute