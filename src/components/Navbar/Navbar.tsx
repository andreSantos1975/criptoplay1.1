"use client";

import { Button } from "@/components/ui/button";
import { TrendingUp, Menu, X } from "lucide-react";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import styles from "./Navbar.module.css";
import clsx from "clsx";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();

  const isAcademiaPage = pathname === "/academia-criptoplay";

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.flexBetween}>
          {/* Logo */}
          <Link href="/" className={styles.logoLink}>
            <div className={styles.logoContainer}>
              <div className={styles.logoIconWrapper}>
                <TrendingUp className={styles.logoIcon} />
              </div>
              <span className={clsx(styles.logoText, isAcademiaPage && styles.logoTextAcademia)}>CriptoPlay</span>
            </div>
          </Link>
          {/* Desktop Navigation */}
          <nav className={styles.desktopNav}>
            <Link href="/" className={clsx(styles.navLink, isAcademiaPage && styles.navLinkAcademia)}>
              Home
            </Link>
            <Link href="/ranking" className={clsx(styles.navLink, isAcademiaPage && styles.navLinkAcademia)}>
              Ranking
            </Link>
            <Link href="/#recursos" className={clsx(styles.navLink, isAcademiaPage && styles.navLinkAcademia)}>
              Recursos
            </Link>
            <Link href="/contato" className={clsx(styles.navLink, isAcademiaPage && styles.navLinkAcademia)}>
              Contato
            </Link>
            {status === "authenticated" && (
              <Link href="/academia-criptoplay" className={clsx(styles.navLink, isAcademiaPage && styles.navLinkAcademia)}>
                Academia
              </Link>
            )}
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
                href="/ranking"
                className={styles.mobileNavLink}
                onClick={() => setIsMenuOpen(false)}
              >
                Ranking
              </Link>
              
              <Link
                href="/#recursos"
                className={styles.mobileNavLink}
                onClick={() => setIsMenuOpen(false)}
              >
                Recursos
              </Link>
              <Link
                href="/contato"
                className={styles.mobileNavLink}
                onClick={() => setIsMenuOpen(false)}
              >
                Contato
              </Link>
              {status === "authenticated" && (
                <Link
                  href="/academia-criptoplay"
                  className={clsx(styles.mobileNavLink, isAcademiaPage && styles.navLinkAcademia)}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Academia
                </Link>
              )}
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

export default Navbar;
