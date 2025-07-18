import { Link } from 'react-router-dom'

function Box() {
  return (
    <div className="p-8 bg-green-100 text-center min-h-screen">
      <h1 className="text-3xl font-bold text-green-800 mb-6">Box Page</h1>
      <p className="text-gray-600 mb-8">This is the general box page without a specific ID.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {[1, 2, 3, 4, 5, 6].map(id => (
          <Link
            key={id}
            to={`/box/${id}`}
            className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-green-200"
          >
            <h3 className="text-lg font-semibold text-green-700">Box {id}</h3>
            <p className="text-gray-600 text-sm mt-2">Click to view details</p>
          </Link>
        ))}
      </div>
      
      <Link 
        to="/" 
        className="inline-block mt-8 text-green-600 hover:text-green-800 underline"
      >
        Back to Home
      </Link>
    </div>
  )
}

export default Box