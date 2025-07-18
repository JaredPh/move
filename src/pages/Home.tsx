import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="p-8 bg-blue-100 text-center min-h-screen">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Home Page</h1>
      <p className="text-gray-600 mb-8">Welcome to the Move PWA!</p>
      
      <div className="space-y-4">
        <Link 
          to="/login" 
          className="block w-full max-w-md mx-auto p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Login
        </Link>
        <Link 
          to="/box" 
          className="block w-full max-w-md mx-auto p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Go to Box
        </Link>
        <Link 
          to="/box/123" 
          className="block w-full max-w-md mx-auto p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Go to Box with ID (123)
        </Link>
      </div>
    </div>
  )
}

export default Home