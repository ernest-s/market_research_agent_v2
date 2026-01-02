// This has to be moved later to marketing
import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "1.5rem 2rem",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ fontWeight: 600 }}>Qualitative Research Platform</h2>

        <nav>
          <Link
            href="/login"
            style={{
              textDecoration: "none",
              padding: "0.5rem 1rem",
              border: "1px solid #111",
              borderRadius: "6px",
              fontSize: "0.9rem",
            }}
          >
            Log in
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section
        style={{
          flex: 1,
          padding: "4rem 2rem",
          maxWidth: "960px",
          margin: "0 auto",
        }}
      >
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
          Turn Conversations into Insights
        </h1>

        <p
          style={{
            fontSize: "1.1rem",
            lineHeight: 1.6,
            color: "#444",
            maxWidth: "720px",
          }}
        >
          Design qualitative studies, run interviews, and generate deep insights
          using AI-assisted workflows — all in one platform.
        </p>

        <div style={{ marginTop: "2rem" }}>
          <Link
            href="/login"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              background: "#111",
              color: "#fff",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Get started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "1.5rem 2rem",
          borderTop: "1px solid #e5e7eb",
          fontSize: "0.85rem",
          color: "#666",
          textAlign: "center",
        }}
      >
        © {new Date().getFullYear()} Qualitative Research Platform
      </footer>
    </main>
  );
}
