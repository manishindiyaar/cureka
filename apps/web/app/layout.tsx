import './globals.css'
import { Inter } from 'next/font/google'
import { ReactQueryProvider } from '../components/ReactQueryProvider'
import { ToastProvider } from '../components/ui/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Cureka - Staff Dashboard',
  description: 'Healthcare staff management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReactQueryProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}