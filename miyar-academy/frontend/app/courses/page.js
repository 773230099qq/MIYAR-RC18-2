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
      <h1 style={{ color: "#1b365d" }}>كل المقررات ({courses.length})</h1>
      <p style={{ color: "#555" }}>
        اضغط أي مقرر لعرض محاضراته ومحتواه التفصيلي.
      </p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {courses.map((c) => {
          const isDraft = c.approval_status !== "approved";
          return (
            <li
              key={c.id}
              style={{ background: "#fff", border: "1px solid #dcdde1", borderRadius: 6, padding: 16, marginBottom: 12 }}
            >
              <a href={`/courses/${encodeURIComponent(c.course_code)}`} style={{ textDecoration: "none", color: "inherit" }}>
                <strong style={{ color: "#1b365d" }}>{c.course_code}</strong> — {c.title_ar} / {c.title_en}
                <span style={{ color: "#2980b9" }}> ({levels[c.level] || c.level})</span>
                {isDraft && (
                  <span
                    style={{
                      background: "#fff3cd",
                      color: "#8a6d00",
                      border: "1px solid #e0c868",
                      borderRadius: 20,
                      padding: "2px 10px",
                      fontSize: 12,
                      marginRight: 8,
                    }}
                  >
                    ⚠ مسودة بانتظار مراجعة
                  </span>
                )}
                {c.blurb_ar && (
                  <div style={{ color: "#7f8c8d", fontSize: 14, marginTop: 6 }}>{c.blurb_ar}</div>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
