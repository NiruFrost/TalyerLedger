import Link from 'next/link'
import { redirect } from 'next/navigation'
import { RegisterForm } from '@/features/auth/components/register-form'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { env } from '@/lib/env'

export default function RegisterPage() {
  if (!env.NEXT_PUBLIC_ALLOW_SIGN_UP) redirect('/login?error=registration_disabled')

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            <h1>TalyerLedger</h1>
          </Link>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </main>
  )
}
