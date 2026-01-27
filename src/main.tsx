import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from './app/App'
import { useUserStore } from './entities/user'
import './index.css'

// 모바일 디버깅을 위한 에러 핸들러 (임시)
if (import.meta.env.PROD) {
  window.onerror = (msg, url, lineNo, columnNo, error) => {
    alert(`Error: ${msg}\nLine: ${lineNo}\nColumn: ${columnNo}\nError obj: ${JSON.stringify(error)}`);
    return false;
  };
}

const queryClient = new QueryClient()

const Root = () => {
  const syncSession = useUserStore((state) => state.syncSession)

  useEffect(() => {
    syncSession()
  }, [syncSession])

  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
