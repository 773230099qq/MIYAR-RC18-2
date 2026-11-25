export const dynamic = "force-dynamic";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function DraftBadge() {
  return (
    <span
      style={{
        background: "#fff3cd",
        color: "#8a6d00",
        border: "1px solid #e0c868",
        borderRadius: 20,
        padding: "3px 12px",
        fontSize: 13,
        fontWeight: "bold",
      }}
    >
      ⚠ مسودة بانتظار مراجعة
    </span>
  );
}

function ApprovedBadge() {
  return (
    <span
      style={{
        background: "#d4edda",
        color: "#1e7e34",
        borderRadius: 20,
        padding: "3px 12px",
        fontSize: 13,
        fontWeight: "bold",
      }}
    >
      ✓ معتمد علميا
    </span>
  );
}

export default async function CoursePage({ params }) {
  const { code } = params;
  let course = null;
  let lectures = [];
  let error = null;

  try {
    const res = await fetch(`${API}/api/courses/${encodeURIComponent(code)}`, { cache: "no-store" });
    if (res.ok) {
      course = (await res.json()).course;
    } else {
      error = "المقرر غير موجود";
    }
    if (course) {
      const lres = await fetch(`${API}/api/courses/${encodeURIComponent(code)}/lectures`, { cache: "no-store" });
      if (lres.ok) {
        lectures = (await lres.json()).lectures || [];
      }
    }
  } catch (e) {
    error = "تعذر الاتصال بالخادم";
  }

  if (error) {
    return (
      <div>
        <h1 style={{ color: "#c0392b" }}>{error}</h1>
        <a href="/courses" style={{ color: "#1b365d" }}>← عودة إلى المقررات</a>
      </div>
    );
  }

  const isDraft = course.approval_status !== "approved";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ color: "#1b365d", marginBottom: 4 }}>
            {course.title_ar} <code style={{ fontSize: 16, color: "#8395a7" }}>{course.course_code}</code>
          </h1>
          <p style={{ color: "#7f8c8d", marginTop: 0 }}>{course.title_en}</p>
        </div>
        {isDraft ? <DraftBadge /> : <ApprovedBadge />}
      </div>

      {isDraft && (
        <p
          style={{
            background: "#fffaf0",
            border: "1px solid #f0d9a8",
            borderRadius: 8,
            padding: "10px 14px",
            color: "#7a5c00",
            fontSize: 14,
          }}
        >
          هذا المقرر محتوى مسودة مدموجة من مكتبة EPIACADEMY (تحديث 32) — لم تكتمل مراجعته العلمية والعربية
          بواسطة مختصين بشريين بعد. استخدمه للتدريب والتعلم الذاتي مع هذا التنويه.
        </p>
      )}

      {course.blurb_ar && (
        <p style={{ color: "#2c3e50", background: "#e8eef7", padding: "10px 14px", borderRadius: 8 }}>
          {course.blurb_ar}
        </p>
      )}

      <h2 style={{ color: "#1b365d" }}>المحاضرات ({lectures.length})</h2>
      {lectures.length === 0 && (
        <p style={{ color: "#7f8c8d" }}>
          لم تُكتب محاضرات تفصيلية لهذا المقرر بعد — سيُضاف المحتوى مع تحديثات المنهاج.
        </p>
      )}
      {lectures.map((l) => (
        <div
          key={l.lecture_no}
          style={{
            border: "1px solid #dde3ea",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 10,
            background: "#fff",
          }}
        >
          <strong style={{ color: "#2c3e50" }}>
            المحاضرة {l.lecture_no}: {l.title_ar}
          </strong>
          <div style={{ color: "#7f8c8d", fontSize: 14, marginTop: 2 }}>{l.title_en}</div>
          {l.objectives_ar && (
            <p style={{ color: "#555", fontSize: 14, margin: "8px 0 0" }}>{l.objectives_ar}</p>
          )}
        </div>
      ))}

      {course.source_ref && (
        <p style={{ color: "#95a5a6", fontSize: 13, marginTop: 24 }}>
          مرجع المحتوى الأصلي: {course.source_ref} في EPIACADEMY Update 32 (أرشيف الشفافية في مجلد content/)
        </p>
      )}
      <a href="/courses" style={{ color: "#1b365d" }}>← عودة إلى المقررات</a>
    </div>
  );
}
