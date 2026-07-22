import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from '@/App'
import { initTheme } from '@/hooks/useTheme'
import '@/styles/globals.css'

// Applied before the first render so the page never flashes the wrong theme.
initTheme()

const container = document.getElementById('root')
if (!container) throw new Error('Root container #root not found')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
