"use client";

import { Button } from "@/components/ui/button";
import { TrendingUp, Menu, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import { useSession } from "next-auth/react"; // Add this import
import styles from "./Navbar.module.css";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession(); // Get session data and status

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.flexBetween}>
          {/* Logo */}
          <a href="/" className={styles.logoLink}> {/* Added a tag and class */}
            <div className={styles.logoContainer}>
              <div className={styles.logoIconWrapper}>
                <TrendingUp className={styles.logoIcon} />
              </div>
              <span className={styles.logoText}>CriptoPlay</span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className={styles.desktopNav}>
            <a href="/jornada-cripto" className={styles.navLink}>
              Jornada Crypto
            </a>
            <a href="#recursos" className={styles.navLink}>
              Recursos
            </a>
            
            <a href="#depoimentos" className={styles.navLink}>
              Depoimentos
            </a>
            <a href="#contato" className={styles.navLink}>
              Contato
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className={styles.desktopCta}>
            {status === "authenticated" ? (
              <Button variant="cta" onClick={() => router.push('/dashboard')}>Dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => router.push('/login')}>Entrar</Button>
                <Button variant="cta" onClick={() => router.push('/cadastro')}>Começar Agora</Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={styles.mobileMenuButton}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className={styles.mobileMenuIcon} /> : <Menu className={styles.mobileMenuIcon} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className={styles.mobileNavContainer}>
            <nav className={styles.mobileNav}>
              <a
                href="/jornada-cripto"
                className={styles.mobileNavLink}
                onClick={() => setIsMenuOpen(false)}
              >
                Jornada Crypto
              </a>
              <a
                href="#recursos"
                className={styles.mobileNavLink}
                onClick={() => setIsMenuOpen(false)}
              >
                Recursos
              </a>
              
              <a
                href="#depoimentos"
                className={styles.mobileNavLink}
                onClick={() => setIsMenuOpen(false)}
              >
                Depoimentos
              </a>
              <a
                href="#contato"
                className={styles.mobileNavLink}
                onClick={() => setIsMenuOpen(false)}
              >
                Contato
              </a>
              <div className={styles.mobileCtaContainer}>
                {status === "authenticated" ? (
                  <Button variant="cta" className={styles.mobileCtaButton} onClick={() => { router.push('/dashboard'); setIsMenuOpen(false); }}>
                    Dashboard
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" className={styles.mobileCtaButton} onClick={() => { router.push('/login'); setIsMenuOpen(false); }}>
                      Entrar
                    </Button>
                    <Button variant="cta" className={styles.mobileCtaButton} onClick={() => { router.push('/cadastro'); setIsMenuOpen(false); }}>
                      Começar Agora
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
