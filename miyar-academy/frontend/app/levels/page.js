export const dynamic = "force-dynamic";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const LEVEL_STYLES = {
  Foundational: { label: "المستوى التأسيسي", color: "#1e7e34", bg: "#e8f5e9" },
  Intermediate: { label: "المستوى المتوسط", color: "#b26a00", bg: "#fff3e0" },
  Advanced: { label: "المستوى المتقدم", color: "#1b365d", bg: "#e8eef7" },
};

const LEVELS_ORDER = ["Foundational", "Intermediate", "Advanced"];

export default async function LevelsPage() {
  let levels = [];
  let error = null;
  try {
    const res = await fetch(`${API}/api/courses/levels`, { cache: "no-store" });
    if (res.ok) {
      const body = await res.json();
      levels = body.levels || [];
    } else {
      error = "تعذر جلب المستويات من الخادم";
    }
  } catch (e) {
    error = "تعذر الاتصال بالخادم";
  }

  return (
    <div>
      <h1 style={{ color: "#1b365d" }}>المستويات الأكاديمية</h1>
      <p style={{ color: "#555" }}>
        ثلاثة مستويات مرتبة: التأسيسي، فالمتوسط، فالمتقدم.
        بعض المقررات تتطلب إكمال مقرر سابق بنسبة 80% على الأقل قبل التسجيل.
      </p>
      {error && <p style={{ color: "#c0392b" }}>{error}</p>}
      {LEVELS_ORDER.map((lv) => {
        const list = levels.filter((c) => c.level === lv);
        if (list.length === 0) return null;
        const style = LEVEL_STYLES[lv];
        return (
          <section key={lv} style={{ marginBottom: 28 }}>
            <h2
              style={{
                color: style.color,
                background: style.bg,
                padding: "8px 14px",
                borderRadius: 8,
              }}
            >
              {style.label}
            </h2>
            {list.map((c) => (
              <div
                key={c.course_code}
                style={{
                  border: "1px solid #dde3ea",
                  borderRadius: 8,
                  padding: "12px 16px",
                  marginBottom: 10,
                  background: "#fff",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <strong style={{ color: "#2c3e50" }}>{c.title_ar}</strong>
                  <code style={{ color: "#8395a7" }}>{c.course_code}</code>
                </div>
                <div style={{ color: "#7f8c8d", fontSize: 14, marginTop: 4 }}>{c.title_en}</div>
                <div style={{ marginTop: 6 }}>
                  {c.required_course_code ? (
                    <span style={{ color: "#b26a00", fontSize: 14 }}>
                      ⚠ يتطلب إكمال مقرر {c.required_course_code} بنسبة 80% على الأقل
                    </span>
                  ) : (
                    <span style={{ color: "#1e7e34", fontSize: 14 }}>
                      ✓ متاح للتسجيل مباشرة
                    </span>
                  )}
                </div>
              </div>
            ))}
          </section>
        );
      })}
      {!error && levels.length === 0 && <p>لا توجد مقررات مسجلة بعد.</p>}
    </div>
  );
}
