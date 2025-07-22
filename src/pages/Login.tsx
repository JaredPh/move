import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signInWithGoogle } = useAuth()

  console.log('Login component rendered')

  const handleGoogleSignIn = async () => {
    console.log('Google sign in button clicked')
    setLoading(true)
    setError('')
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-900 min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 px-4">
        <div className="text-center">
          <img src="/move/logo.png" alt="Move PWA Logo" className="h-16 w-auto mx-auto" />
          <h2 className="mt-6 text-3xl font-semibold text-white">Sign in to your account</h2>
          <p className="mt-2 text-sm text-gray-400">Access your sports club information</p>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500/20 rounded-md p-4">
              <p className="text-sm text-red-100">{error}</p>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-indigo-300 group-hover:text-indigo-200" viewBox="0 0 24 24">
                <path fill="currentColor" fillOpacity="0.8" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" fillOpacity="0.6" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" fillOpacity="0.9" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </span>
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our terms of service and privacy policy
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login