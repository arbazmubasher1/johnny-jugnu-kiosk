import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'        // Kiosk interface
import Kitchen from './Kitchen.jsx' // Kitchen Display
import './input.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />            {/* Customer/Kiosk App */}
        <Route path="/kitchen" element={<Kitchen />} /> {/* Kitchen Display */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
