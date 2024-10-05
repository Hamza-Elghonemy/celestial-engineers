import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Routing from './router.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Routing />
  </StrictMode>,
)
