import { Link, useParams } from 'react-router-dom'

function BoxDetail() {
  const { id } = useParams<{ id: string }>()
  
  return (
    <div className="p-8 bg-purple-100 text-center min-h-screen">
      <h1 className="text-3xl font-bold text-purple-800 mb-6">Box Detail</h1>
      <p className="text-gray-600 mb-8">Showing details for Box ID: <span className="font-semibold text-purple-700">{id}</span></p>
      
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-purple-700 mb-4">Box {id} Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div>
            <h3 className="font-medium text-gray-700">Box ID</h3>
            <p className="text-gray-600">{id}</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700">Status</h3>
            <p className="text-green-600">Active</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700">Created</h3>
            <p className="text-gray-600">Today</p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700">Items</h3>
            <p className="text-gray-600">{Math.floor(Math.random() * 50) + 1} items</p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 space-x-4">
        <Link 
          to="/box" 
          className="inline-block px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          Back to Box List
        </Link>
        <Link 
          to="/" 
          className="inline-block px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}

export default BoxDetail