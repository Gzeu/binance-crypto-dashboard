'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="binance-dashboard-theme"
      disableTransitionOnChange={false}
      {...props}
    >
      <div suppressHydrationWarning>
        {children}
      </div>
    </NextThemesProvider>
  )
}