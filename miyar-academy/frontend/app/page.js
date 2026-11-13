const levels = {
  Foundational: "تأسيسي",
  Intermediate: "متوسط",
  Advanced: "متقدم",
};

async function getCourses() {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${api}/api/courses`, { cache: "no-store" });
    if (!res.ok) return [];
    const body = await res.json();
    return body.courses || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const courses = await getCourses();
  return (
    <div>
      <h1 style={{ color: "#1b365d" }}>مرحبًا بكم في أكاديمية MIYAR</h1>
      <p>منصة تعليمية متخصصة في الوبائيات والإحصاء الحيوي والصحة العامة، بمستويات تأسيسية ومتوسطة ومتقدمة مع مختبر R تفاعلي.</p>
      <h2>المقررات المتاحة ({courses.length})</h2>
      {courses.length === 0 ? (
        <p style={{ color: "#7f8c8d" }}>لا يمكن الوصول إلى قائمة المقررات حاليًا. تأكد من تشغيل الخادم الخلفي.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {courses.map((c) => (
            <li key={c.id} style={{ background: "#fff", border: "1px solid #dcdde1", borderRadius: 6, padding: 16, marginBottom: 12 }}>
              <strong>{c.course_code}</strong> — {c.title_ar}
              <span style={{ float: "left", color: "#2980b9" }}>{levels[c.level] || c.level}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
