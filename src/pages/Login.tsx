import { Link } from 'react-router-dom'

function Login() {
  return (
    <div className="p-8 bg-gray-100 text-center min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Login Page</h1>
      
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Login
          </button>
        </form>
      </div>
      
      <Link 
        to="/" 
        className="inline-block mt-6 text-blue-600 hover:text-blue-800 underline"
      >
        Back to Home
      </Link>
    </div>
  )
}

export default Login