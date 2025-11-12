import Link from "next/link";
import "./style/welcome.css";

export default function Home() {
  return (
    <div className="welcome-page">
      <h1>Welcome to Finansialin!</h1>
      <Link href="/login">Go to Login</Link>
    </div>
  );
}
