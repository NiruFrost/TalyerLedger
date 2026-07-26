import Link from 'next/link'
import { LoginForm } from '@/features/auth/components/login-form'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'

const AUTH_MESSAGES: Record<string, string> = {
  auth_callback_error: 'The sign-in link could not be verified. Request a new link and try again.',
  registration_disabled: 'Account creation is disabled. Contact the workshop owner for access.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            <h1>TalyerLedger</h1>
          </Link>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm message={error ? AUTH_MESSAGES[error] : undefined} />
        </CardContent>
      </Card>
    </main>
  )
}
