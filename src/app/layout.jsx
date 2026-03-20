import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'react-hot-toast'
import { SucursalProvider } from '@/contexts/SucursalContext'
import PageTitleHandler from '@/components/title/PageTitleHandler' // 👈 Importamos el componente


export const metadata = {
  title: 'Jard Complications',
  description: 'Sistema de gestión integral para Jard Complications',
}
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // Los grosores que necesitas
  display: 'swap', // Mejor experiencia de carga
})


export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <SucursalProvider>
            {children}
            <PageTitleHandler />
            <Toaster
              position="bottom-right"
              reverseOrder={false}
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#fff',
                  color: '#1f2937',
                  boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                },
                success: {
                  style: { background: '#4ade80', color: 'black' },
                },
                error: {
                  style: { background: '#f87171', color: 'black' },
                },
              }}
            />
          </SucursalProvider>
        </AuthProvider>
      </body>
    </html>
  )
}