// app/layout.jsx
import "./globals.css";
import ClientProviders from "./components/ClientProviders"; // Import the new wrapper

export const metadata = {
  title: "Finansialin",
  description: "Personal Finance Management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent zoom on page load and tab switch
              window.addEventListener('load', function() {
                document.body.style.zoom = '1';
                document.documentElement.style.zoom = '1';
              });

              // Prevent zoom on focus/blur events
              document.addEventListener('visibilitychange', function() {
                if (!document.hidden) {
                  document.body.style.zoom = '1';
                  document.documentElement.style.zoom = '1';
                }
              });

              // Prevent pinch zoom on mobile
              document.addEventListener('touchstart', function(event) {
                if (event.touches.length > 1) {
                  event.preventDefault();
                }
              }, { passive: false });

              // Prevent zoom on input focus
              document.addEventListener('focusin', function(e) {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                  e.target.style.fontSize = 'inherit';
                }
              });
            `,
          }}
        />
      </head>
      <body>
        {/* Replace the TransactionProvider with the combined ClientProviders */}
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
