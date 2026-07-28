import { ToastProvider } from './components/Toast'
import ErrorBoundary from './components/ErrorBoundary'
import Library from './pages/Library'

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Library />
      </ToastProvider>
    </ErrorBoundary>
  )
}
