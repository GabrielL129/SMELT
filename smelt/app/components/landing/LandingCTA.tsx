"use client";

import { Flame, Wallet, Zap, ArrowRight, Twitter, MessageCircle, Github, BookOpen } from "lucide-react";
import styles from "./LandingCTA.module.css";

export default function LandingCTA() {
  return (
    <section className={styles.section} id="enter">
      <div className={styles.container}>
        <div className={styles.bgGlow} />

        {/* Animated ore particles */}
        <div className={styles.oreParticles}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className={styles.oreParticle} style={{
              left: `${10 + i * 12}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${3 + (i % 3)}s`,
            }} />
          ))}
        </div>

        <div className={styles.content}>
          <div className={styles.tagLine}>
            <span className={styles.tag}>// OPERATOR ACCESS</span>
          </div>

          <h2 className={styles.title}>
            THE FOUNDRY<br />
            <span className={styles.titleAccent}>IS OPERATIONAL</span>
          </h2>

          <p className={styles.desc}>
            Connect your wallet. Deploy your foundry.<br />
            Assign your FOREMAN. Process the first batch.
          </p>

          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepIcon}><Wallet size={14} /></div>
              <span className={styles.stepText}>CONNECT WALLET</span>
            </div>
            <div className={styles.stepArrow}><ArrowRight size={14} /></div>
            <div className={styles.step}>
              <div className={styles.stepIcon}><Flame size={14} /></div>
              <span className={styles.stepText}>DEPLOY FOUNDRY</span>
            </div>
            <div className={styles.stepArrow}><ArrowRight size={14} /></div>
            <div className={styles.step}>
              <div className={styles.stepIcon}><Zap size={14} /></div>
              <span className={styles.stepText}>SMELT SCRAP</span>
            </div>
          </div>

          <a href="http://app.smelt.world" className={styles.ctaBtn}>
            <Flame size={16} />
            ENTER THE FOUNDRY
          </a>

          <div className={styles.socialRow}>
            <a href="#" className={styles.socialLink}>
              <Twitter size={13} />
              X / TWITTER
            </a>
            <span className={styles.socialDivider}>·</span>
            <a href="#" className={styles.socialLink}>
              <MessageCircle size={13} />
              DISCORD
            </a>
            <span className={styles.socialDivider}>·</span>
            <a href="#" className={styles.socialLink}>
              <BookOpen size={13} />
              DOCS
            </a>
            <span className={styles.socialDivider}>·</span>
            <a href="#" className={styles.socialLink}>
              <Github size={13} />
              GITHUB
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
