// app/layout.jsx
import "./globals.css";
import ClientProviders from "./components/ClientProviders"; // Import the new wrapper

export const metadata = {
  title: "Finansialin",
  description: "Personal Finance Management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body suppressHydrationWarning>
        {/* Replace the TransactionProvider with the combined ClientProviders */}
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
