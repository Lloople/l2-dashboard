import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './layout/Layout.jsx'
import SpStatsPage from './pages/sp/SpStatsPage.jsx'
import HomePage from './pages/HomePage.jsx'
import './styles/global.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

/**
 * Punt d'entrada de la app.
 * Les rutes es registren aquí; per afegir una secció nova a la barra lateral,
 * només cal afegir una entrada a SECTIONS (a layout/Sections.js) i una ruta aquí.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/stats/sp" element={<SpStatsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
