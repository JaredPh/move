import { BrowserRouter, Routes, Navigate } from 'react-router-dom'
import { Route } from 'react-router-dom'

import config, { type Route as RouteType } from './config'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

function getRouteElement(route: RouteType) {
  switch (route.type) {
    case 'page':
      if (route.protected) {
        return <Route key={route.path} path={route.path} element={<ProtectedRoute><route.component /></ProtectedRoute>} />
      } else {
        return <Route key={route.path} path={route.path} element={<route.component />} />
      }
    case 'redirect':
      return <Route key={route.path} path={route.path} element={<Navigate to={route.redirect} replace />} />
  }
}

function App() {
  const routes = Object.values(config.routes)
  return (
    <AuthProvider>
      <BrowserRouter basename="/move">
        <Routes>
          {routes.map(getRouteElement)}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
