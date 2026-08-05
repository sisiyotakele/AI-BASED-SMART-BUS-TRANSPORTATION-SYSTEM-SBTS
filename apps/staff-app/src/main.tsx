import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './features/driver/index.css'
import App from './features/driver/App.tsx'
import 'leaflet/dist/leaflet.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
