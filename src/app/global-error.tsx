'use client'

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="grid min-h-screen place-items-center p-6 text-center">
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold">TalyerLedger could not start</h1>
            <p>Reload the application. If the problem continues, check the configuration logs.</p>
            <button type="button" onClick={reset} className="rounded-md border px-4 py-2">
              Reload
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
