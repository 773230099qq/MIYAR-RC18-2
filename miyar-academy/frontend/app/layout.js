export const metadata = {
  title: "أكاديمية MIYAR التعليمية",
  description: "منصة أكاديمية ثنائية اللغة للوبائيات والإحصاء الحيوي",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ fontFamily: "Tahoma, Arial, sans-serif", margin: 0, background: "#fafbfc", color: "#2c3e50" }}>
        <header style={{ background: "#1b365d", color: "#fff", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong>أكاديمية MIYAR التعليمية</strong>
          <nav style={{ display: "flex", gap: 16 }}>
            <a href="/" style={{ color: "#fff", textDecoration: "none" }}>الرئيسية</a>
            <a href="/courses" style={{ color: "#fff", textDecoration: "none" }}>المقررات</a>
            <a href="/login" style={{ color: "#fff", textDecoration: "none" }}>تسجيل الدخول</a>
          </nav>
        </header>
        <main style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>{children}</main>
      </body>
    </html>
  );
}
