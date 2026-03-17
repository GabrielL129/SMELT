import styles from "./LandingFooter.module.css";

export default function LandingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.left}>
          <span className={styles.logo}>SMELT</span>
          <span className={styles.tagline}>AUTONOMOUS FOUNDRY PROTOCOL</span>
          <span className={styles.version}>EPOCH 01 · v0.1.0 · SMELT.WORLD</span>
        </div>
        <div className={styles.right}>
          <div className={styles.linkGroup}>
            <span className={styles.linkGroupLabel}>PROTOCOL</span>
            <a href="#">DOCS</a>
            <a href="#">WHITEPAPER</a>
            <a href="#">CHANGELOG</a>
          </div>
          <div className={styles.linkGroup}>
            <span className={styles.linkGroupLabel}>COMMUNITY</span>
            <a href="#">X / TWITTER</a>
            <a href="#">DISCORD</a>
            <a href="#">GITHUB</a>
          </div>
          <div className={styles.linkGroup}>
            <span className={styles.linkGroupLabel}>LEGAL</span>
            <a href="#">TERMS</a>
            <a href="#">PRIVACY</a>
          </div>
        </div>
      </div>
      <div className={styles.bottom}>
        <span>© 2025 SMELT PROTOCOL. ALL RIGHTS RESERVED.</span>
        <span className={styles.bottomRight}>
          BUILT ON SUPABASE · POWERED BY FOREMAN-7
        </span>
      </div>
    </footer>
  );
}
