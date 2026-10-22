import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import '@fontsource/newsreader/400.css'
import '@fontsource/newsreader/600.css'
import '@fontsource/newsreader/400-italic.css'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/500.css'
import '@fontsource/outfit/600.css'
import './styles.css'

const root = document.getElementById('root')
if (!root) throw new Error('Missing root')

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
