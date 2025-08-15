"use client";

import { Button } from "@/components/ui/button";
import { TrendingUp, Menu, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import Link from "next/link";
import { useSession, signOut } from "next-auth/react"; // Add signOut to this import
import styles from "./Navbar.module.css";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { status } = useSession(); // Get session data and status

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.flexBetween}>
          {/* Logo */}
          <Link href="/" className={styles.logoLink}> {/* Added a tag and class */}
            <div className={styles.logoContainer}>
              <div className={styles.logoIconWrapper}>
                <TrendingUp className={styles.logoIcon} />
              </div>
              <span className={styles.logoText}>CriptoPlay</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className={styles.desktopNav}>
            <Link href="/" className={styles.navLink}>
              Home
            </Link>
            <Link href="/jornada-cripto" className={styles.navLink}>
              Jornada Crypto
            </Link>
            <a href="#recursos" className={styles.navLink}>
              Recursos
            </a>
            
            <Link href="/blog" className={styles.navLink}>
              Blog
            </Link>
            <Link href="/contato" className={styles.navLink}>
              Contato
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className={styles.desktopCta}>
            {status === "authenticated" ? (
              <>
                <Button variant="ghost" onClick={() => router.push('/dashboard')}>Dashboard</Button>
                <Button variant="cta" onClick={() => signOut()}>Sair</Button>
              </>
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
              <Link
                href="/"
                className={styles.mobileNavLink}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/jornada-cripto"
                className={styles.mobileNavLink}
                onClick={() => setIsMenuOpen(false)}
              >
                Jornada Crypto
              </Link>
              <a
                href="#recursos"
                className={styles.mobileNavLink}
                onClick={() => setIsMenuOpen(false)}
              >
                Recursos
              </a>
              
              <Link
                href="/blog"
                className={styles.mobileNavLink}
                onClick={() => setIsMenuOpen(false)}
              >
                Blog
              </Link>
              <Link
                href="/contato"
                className={styles.mobileNavLink}
                onClick={() => setIsMenuOpen(false)}
              >
                Contato
              </Link>
              <div className={styles.mobileCtaContainer}>
                {status === "authenticated" ? (
                  <>
                    <Button variant="ghost" className={styles.mobileCtaButton} onClick={() => { router.push('/dashboard'); setIsMenuOpen(false); }}>
                      Dashboard
                    </Button>
                    <Button variant="cta" className={styles.mobileCtaButton} onClick={() => { signOut(); setIsMenuOpen(false); }}>
                      Sair
                    </Button>
                  </>
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
