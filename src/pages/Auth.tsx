import React, { useState } from 'react'
import { AuthForm } from '@/components/auth/AuthForm'
import { useAuth } from '@/contexts/AuthContext'
import { Navigate } from 'react-router-dom'

const Auth: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-md">
        <AuthForm mode={mode} onModeChange={setMode} />
      </div>
    </div>
  )
}

export default Auth