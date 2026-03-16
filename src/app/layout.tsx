import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Flip 7 — Compteur de score',
  description: 'Compteur de score multijoueur en temps réel pour Flip 7',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0, background: '#0f0e17' }}>
        {children}
      </body>
    </html>
  )
}
