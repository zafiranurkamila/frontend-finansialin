import Link from "next/link";
import "./style/welcome.css";

export default function Home() {
  return (
    <div className="welcome-page">
      <div className="welcome-cloud cloud-left" />
      <div className="welcome-cloud cloud-right" />

      <main className="welcome-shell">
        <header className="welcome-topbar">
          <div className="brand-wrap">
            <span className="brand-dot" />
            <h1>Finansialin</h1>
          </div>
        </header>

        <section className="welcome-hero">
          <div className="hero-illustration" aria-hidden="true">
            <div className="halo" />
            <img src="/hero-reference-1.jpg" alt="Ilustrasi Finansialin" className="hero-image" />
            <div className="cloud-base" />
            <div className="ground-wave" />
          </div>

          <div className="hero-copy">
            <h2>ABOUT US</h2>
            <p>
              Finansialin dirancang untuk bantu kamu mengelola keuangan harian dengan lebih santai, rapi, dan terarah.
              Semua transaksi, budget, dan pengingat penting tersusun otomatis dalam satu tempat.
            </p>
            <p>
              Dengan bantuan insight AI, kamu bisa tahu area pengeluaran yang perlu ditekan sebelum budget melewati batas.
            </p>

            <div className="welcome-actions">
              <Link href="/login" className="welcome-btn btn-primary">
                Mulai Sekarang
              </Link>
              <Link href="/register" className="welcome-btn btn-secondary">
                Buat Akun
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
