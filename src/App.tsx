import { TooltipProvider } from '@/components/ui/tooltip'
import { DashboardPage } from '@/pages/DashboardPage'

export default function App() {
  return (
    <TooltipProvider delayDuration={150} skipDelayDuration={300}>
      <DashboardPage />
    </TooltipProvider>
  )
}
