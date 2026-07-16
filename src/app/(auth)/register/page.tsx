'use client'

import Link from 'next/link'
import { RegisterForm } from '@/features/auth/components/register-form'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            TalyerLedger
          </Link>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  )
}
