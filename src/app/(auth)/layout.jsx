import { AuthProvider } from '@/contexts/AuthContext'

export default function AuthLayout({ children }) {
    return (
        <AuthProvider>
            {children}
        </AuthProvider>
    )
}