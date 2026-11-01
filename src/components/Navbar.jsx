import { NavLink, Link } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Hiragana", path: "/hiragana", icon: "あ" },
    { name: "Katakana", path: "/katakana", icon: "ア" },
    { name: "Kanji & Vocab", path: "/kanji", icon: "漢" },
    { name: "Flashcards", path: "/flashcards", icon: "札" },
  ];

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        {/* Brand */}
        <Link to="/" style={styles.brand}>
          <span style={styles.logoIcon}>日</span>
          <div style={styles.brandTextGroup}>
            <span style={styles.brandTitle}>日本語 Hub</span>
            <span style={styles.brandSub}>Nihongo Master</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="navbar-navlinks" style={styles.navLinks}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                ...styles.link,
                ...(isActive ? styles.activeLink : {}),
              })}
            >
              <span style={styles.linkIcon}>{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          aria-label="Toggle navigation menu"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="navbar-mobile-toggle"
          style={styles.mobileToggle}
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .navbar-navlinks {
            display: none !important;
          }
          .navbar-mobile-toggle {
            display: block !important;
          }
        }
      `}</style>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={styles.mobileMenu}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              style={({ isActive }) => ({
                ...styles.mobileLink,
                ...(isActive ? styles.mobileActiveLink : {}),
              })}
            >
              <span style={styles.linkIcon}>{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}

const styles = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(10, 15, 30, 0.78)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderBottom: "1px solid rgba(244, 114, 182, 0.18)",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
  },
  container: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "0.75rem 1.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
    color: "#f8fafc",
  },
  logoIcon: {
    fontSize: "1.75rem",
    filter: "drop-shadow(0 0 8px rgba(244, 114, 182, 0.5))",
  },
  brandTextGroup: {
    display: "flex",
    flexDirection: "column",
  },
  brandTitle: {
    fontSize: "1.15rem",
    fontWeight: "800",
    letterSpacing: "0.03em",
    background: "linear-gradient(135deg, #ffffff 40%, #f472b6 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  brandSub: {
    fontSize: "0.68rem",
    color: "#94a3b8",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  link: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "8px 15px",
    borderRadius: "10px",
    color: "#cbd5e1",
    textDecoration: "none",
    fontSize: "0.92rem",
    fontWeight: "500",
    transition: "all 0.2s ease",
    border: "1px solid transparent",
  },
  activeLink: {
    color: "#fdf2f8",
    background: "rgba(244, 114, 182, 0.15)",
    borderColor: "rgba(244, 114, 182, 0.35)",
    boxShadow: "0 0 12px rgba(244, 114, 182, 0.25)",
    fontWeight: "600",
  },
  linkIcon: {
    fontSize: "1rem",
    opacity: 0.9,
  },
  mobileToggle: {
    display: "none",
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#f8fafc",
    fontSize: "1.25rem",
    borderRadius: "8px",
    padding: "6px 12px",
    cursor: "pointer",
  },
  mobileMenu: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "1rem 1.5rem",
    background: "rgba(15, 23, 42, 0.96)",
    borderBottom: "1px solid rgba(244, 114, 182, 0.2)",
  },
  mobileLink: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    borderRadius: "8px",
    color: "#cbd5e1",
    textDecoration: "none",
    fontSize: "0.98rem",
    fontWeight: "500",
  },
  mobileActiveLink: {
    color: "#fdf2f8",
    background: "rgba(244, 114, 182, 0.2)",
    fontWeight: "600",
  },
};
