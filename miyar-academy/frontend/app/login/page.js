"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    try {
      const res = await fetch(`${api}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: body.error || "فشل تسجيل الدخول" });
      } else {
        localStorage.setItem("miyar_token", body.token);
        localStorage.setItem("miyar_user", JSON.stringify(body.user));
        setMessage({ type: "success", text: `مرحبًا ${body.user.username}! تم تسجيل الدخول بنجاح` });
      }
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", background: "#fff", border: "1px solid #dcdde1", borderRadius: 6, padding: 24 }}>
      <h1 style={{ color: "#1b365d", marginTop: 0 }}>تسجيل الدخول</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="email">البريد الإلكتروني</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8, border: "1px solid #dcdde1", borderRadius: 4, boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="password">كلمة المرور</label>
          <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8, border: "1px solid #dcdde1", borderRadius: 4, boxSizing: "border-box" }} />
        </div>
        <button type="submit" disabled={busy}
          style={{ background: "#1b365d", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 4, cursor: "pointer", width: "100%" }}>
          {busy ? "جارٍ التحقق..." : "دخول"}
        </button>
      </form>
      {message && (
        <p style={{ color: message.type === "error" ? "#c0392b" : "#27ae60", marginTop: 16 }}>{message.text}</p>
      )}
    </div>
  );
}
