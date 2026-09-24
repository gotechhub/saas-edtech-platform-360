import Link from "next/link";
export default function NotFound() {
  return (
    <main className="setup">
      <h1>Portal bulunamadı</h1>
      <p>Bağlantının doğru olduğundan emin olun.</p>
      <Link href="/avukat/oguzlawacademy">Demo akademiye dön</Link>
    </main>
  );
}
