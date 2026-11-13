"use client";

import { useEffect, useState } from "react";

const levels = {
  Foundational: "تأسيسي",
  Intermediate: "متوسط",
  Advanced: "متقدم",
};

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    fetch(`${api}/api/courses`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("تعذر جلب المقررات"))))
      .then((body) => setCourses(body.courses || []))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p style={{ color: "#c0392b" }}>{error}</p>;

  return (
    <div>
      <h1 style={{ color: "#1b365d" }}>الدبلوم المتقدم (A-301 إلى A-307)</h1>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {courses.map((c) => (
          <li key={c.id} style={{ background: "#fff", border: "1px solid #dcdde1", borderRadius: 6, padding: 16, marginBottom: 12 }}>
            <strong>{c.course_code}</strong> — {c.title_ar} / {c.title_en}
            <span style={{ float: "left", color: "#2980b9" }}>{levels[c.level] || c.level}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
