"use client";

import { Button } from "@/components/ui/button";
import { TrendingUp, Menu, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import styles from "./Navbar.module.css";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter(); // Initialize useRouter

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
            <a href="#recursos" className={styles.navLink}>
              Recursos
            </a>
            <a href="#como-funciona" className={styles.navLink}>
              Como Funciona
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
            <Button variant="ghost" onClick={() => router.push('/login')}>Entrar</Button> {/* Added onClick */}
            <Button variant="cta" onClick={() => router.push('/cadastro')}>Começar Agora</Button> {/* Added onClick */}
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
                href="#recursos"
                className={styles.mobileNavLink}
                onClick={() => setIsMenuOpen(false)}
              >
                Recursos
              </a>
              <a
                href="#como-funciona"
                className={styles.mobileNavLink}
                onClick={() => setIsMenuOpen(false)}
              >
                Como Funciona
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
                <Button variant="ghost" className={styles.mobileCtaButton} onClick={() => { router.push('/login'); setIsMenuOpen(false); }}> {/* Added onClick and close menu */}
                  Entrar
                </Button>
                <Button variant="cta" className={styles.mobileCtaButton} onClick={() => { router.push('/cadastro'); setIsMenuOpen(false); }}> {/* Added onClick and close menu */}
                  Começar Agora
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
