import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Box from './pages/Box'
import BoxDetail from './pages/BoxDetail'

function App() {
  return (
    <BrowserRouter basename="/move">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/box" element={<Box />} />
        <Route path="/box/:id" element={<BoxDetail />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
