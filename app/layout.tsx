import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './styles/globals.css'
import { ThemeProvider } from './components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Brew MEV',
  icons: {
    icon: 'https://cdn.verity.dev/storage/brew-mev.png',
  },
  description: 'Dashboard for Brew MEV Bot',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
} 
