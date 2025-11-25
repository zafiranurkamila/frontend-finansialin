// app/layout.jsx
import './globals.css';
import ClientProviders from './components/ClientProviders'; // Import the new wrapper

export const metadata = {
  title: 'Finansialin',
  description: 'Personal Finance Management',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Replace the TransactionProvider with the combined ClientProviders */}
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}