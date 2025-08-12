"use client";

import { Button } from "@/components/ui/button";
import { TrendingUp, Menu, X } from "lucide-react";
import { useState } from "react";
import styles from "./Navbar.module.css";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.flexBetween}>
          {/* Logo */}
          <div className={styles.logoContainer}>
            <div className={styles.logoIconWrapper}>
              <TrendingUp className={styles.logoIcon} />
            </div>
            <span className={styles.logoText}>CryptoTrade</span>
          </div>

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
            <Button variant="ghost">Entrar</Button>
            <Button variant="cta">Começar Agora</Button>
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
                <Button variant="ghost" className={styles.mobileCtaButton}>
                  Entrar
                </Button>
                <Button variant="cta" className={styles.mobileCtaButton}>
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
