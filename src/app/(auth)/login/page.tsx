'use client'

import Link from 'next/link'
import { LoginForm } from '@/features/auth/components/login-form'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            TalyerLedger
          </Link>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}
