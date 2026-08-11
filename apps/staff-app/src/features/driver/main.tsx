import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// @ts-ignore: allow side-effect CSS import without type declarations
import './index.css'
import App from './App.tsx'
// @ts-ignore: allow side-effect CSS import without type declarations
import "leaflet/dist/leaflet.css";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
