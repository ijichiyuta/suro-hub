export default function Saved() {
  return (
    <>
      <header className="pad" style={{ paddingTop: 18, paddingBottom: 8 }}>
        <h1 style={{ fontSize: 22 }}>保存した機種</h1>
      </header>
      <div className="pad" style={{ color: "var(--sub)", textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>★</div>
        機種ページの ☆ をタップすると<br />ここに追加されます
      </div>
    </>
  );
}
