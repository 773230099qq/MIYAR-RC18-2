"use client";

import { useEffect, useState } from "react";

export default function QuizPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    fetch(`${api}/api/quizzes?course=A-301`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("تعذر جلب الاختبارات — تأكد من تشغيل الخادم"))))
      .then((body) => setQuizzes(body.quizzes || []))
      .catch((e) => setNotice(e.message));
  }, []);

  function openQuiz(qz) {
    setSelected(qz);
    setAnswers({});
    setResult(null);
    setNotice(null);
  }

  async function submitQuiz() {
    if (!selected) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("miyar_token") : null;
    if (!token) {
      setNotice("يجب تسجيل الدخول أولًا من صفحة تسجيل الدخول");
      return;
    }
    setBusy(true);
    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    try {
      const res = await fetch(`${api}/api/quizzes/${selected.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers }),
      });
      const body = await res.json();
      if (res.ok) {
        setResult(body);
      } else {
        setNotice(body.error || "تعذر إرسال الإجابات");
      }
    } catch {
      setNotice("تعذر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 style={{ color: "#1b365d" }}>الاختبارات الآلية — مقرر A-301</h1>

      {!selected && (
        <div>
          {notice && <p style={{ color: "#c0392b" }}>{notice}</p>}
          <ul style={{ listStyle: "none", padding: 0 }}>
            {quizzes.map((qz) => (
              <li key={qz.id} style={{ background: "#fff", border: "1px solid #dcdde1", borderRadius: 6, padding: 16, marginBottom: 12 }}>
                <strong>{qz.title_ar}</strong> / {qz.title_en}
                <span style={{ color: "#7f8c8d" }}> — {qz.questions.length} أسئلة</span>
                <div>
                  <button onClick={() => openQuiz(qz)}
                    style={{ marginTop: 8, background: "#1b365d", color: "#fff", border: "none", padding: "8px 20px", borderRadius: 4, cursor: "pointer" }}>
                    بدء الاختبار
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selected && (
        <div style={{ background: "#fff", border: "1px solid #dcdde1", borderRadius: 6, padding: 20 }}>
          <h2 style={{ color: "#1b365d", marginTop: 0 }}>{selected.title_ar}</h2>
          {selected.questions.map((q, qi) => (
            <div key={q.id} style={{ marginBottom: 18 }}>
              <strong>{qi + 1}. {q.question_text}</strong>
              <div>
                {q.options.map((opt) => (
                  <label key={opt.idx} style={{ display: "block", margin: "4px 0", cursor: "pointer" }}>
                    <input type="radio" name={`q-${q.id}`}
                      checked={answers[q.id] === opt.idx}
                      onChange={() => setAnswers({ ...answers, [q.id]: opt.idx })} />
                    {" "}{opt.text}
                  </label>
                ))}
              </div>
              {result && (
                <p style={{ color: result.results.find((r) => r.question_id === q.id)?.correct ? "#27ae60" : "#c0392b", margin: "4px 0" }}>
                  {result.results.find((r) => r.question_id === q.id)?.correct ? "✔ صحيحة" : "✘ خاطئة"}
                </p>
              )}
            </div>
          ))}
          {!result && (
            <button onClick={submitQuiz} disabled={busy}
              style={{ background: "#27ae60", color: "#fff", border: "none", padding: "10px 28px", borderRadius: 4, cursor: "pointer" }}>
              {busy ? "جارٍ التصحيح..." : "إرسال الإجابات"}
            </button>
          )}
          {result && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ color: "#1b365d" }}>النتيجة: {result.score} من {result.total}</h3>
              <button onClick={() => { setSelected(null); setResult(null); }}
                style={{ background: "#1b365d", color: "#fff", border: "none", padding: "8px 20px", borderRadius: 4, cursor: "pointer" }}>
                رجوع لقائمة الاختبارات
              </button>
            </div>
          )}
          {notice && <p style={{ color: "#c0392b" }}>{notice}</p>}
        </div>
      )}
    </div>
  );
}
