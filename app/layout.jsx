export const metadata = {
  title: 'Finansialin',
  description: 'Migrated Next.js app',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
