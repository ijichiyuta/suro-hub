import { Star } from "lucide-react";

export default function Saved() {
  return (
    <>
      <header className="pad" style={{ paddingTop: 16, paddingBottom: 8, borderBottom: "1px solid var(--line)" }}>
        <h1 style={{ fontSize: 21 }}>保存した機種</h1>
      </header>
      <div style={{ color: "var(--sub)", textAlign: "center", padding: "56px 24px" }}>
        <Star size={34} style={{ color: "var(--light)", marginBottom: 12 }} />
        <p>機種ページの ☆ をタップすると<br />ここに追加されます</p>
      </div>
    </>
  );
}
