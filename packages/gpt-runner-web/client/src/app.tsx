import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ComponentType, type FC, type PropsWithChildren, Suspense, memo, useEffect } from 'react'
import type { FallbackProps } from 'react-error-boundary'
import { ErrorBoundary } from 'react-error-boundary'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import { getErrorMsg } from '@nicepkg/gpt-runner-shared/common'
import { AppRouter } from './router'
import { GlobalStyle } from './styles/global.styles'
import { LoadingProvider } from './store/context/loading-context'
import { MarkdownStyle } from './styles/markdown.styles'
import { useGlobalStore } from './store/zustand/global'
import { GlobalThemeStyle } from './styles/theme.styles'
import { initI18n } from './helpers/i18n'
import { Toast } from './components/toast'
import { LoadingView } from './components/loading-view'
import { ConfettiProvider } from './store/context/confetti-context'
import { ModalProvider } from './store/context/modal-context'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst',
      keepPreviousData: true,
      onError: (error) => {
        toast.error(getErrorMsg(error))
      },
    },
    mutations: {
      onError: (error) => {
        toast.error(getErrorMsg(error))
      },
    },
  },
})

initI18n()

const FallbackRender: ComponentType<FallbackProps> = memo(({ error }) => {
  // Call resetErrorBoundary() to reset the error boundary and retry the render.

  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: 'red' }}>{error.message}</pre>
    </div>
  )
})

export const AppProviders: FC<PropsWithChildren> = memo(({ children }) => {
  const { langId, themeName } = useGlobalStore()
  const { i18n } = useTranslation()

  useEffect(() => {
    if (!langId)
      return
    i18n.changeLanguage(langId)
    const direction = i18n.dir()
    document.body.dir = direction
  }, [langId])

  useEffect(() => {
    if (!themeName)
      return

    document.body.dataset.theme = themeName
  }, [themeName])

  return (
    <ErrorBoundary FallbackComponent={FallbackRender as any}>
      <QueryClientProvider client={queryClient}>
        <Toast></Toast>
        <ConfettiProvider>
          <LoadingProvider>
            <ModalProvider>
              {children}
            </ModalProvider>
          </LoadingProvider>
        </ConfettiProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
})

export const App: FC = memo(() => {
  return (
    <Suspense fallback={<LoadingView absolute />}>
      <AppProviders>
        <GlobalStyle />
        <GlobalThemeStyle />
        <MarkdownStyle />
        <AppRouter />
      </AppProviders>
    </Suspense>
  )
})
