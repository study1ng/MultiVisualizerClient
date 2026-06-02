import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ViewImage from './ViewImage.tsx'
import get3DImage from './api/get_3dimg.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    
    <ViewImage />
    
  </StrictMode>,
)
