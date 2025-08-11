import './globals.css'

export const metadata = {
  title: 'AWS Quiz Platform',
  description: 'Quiz platform for AWS basics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}