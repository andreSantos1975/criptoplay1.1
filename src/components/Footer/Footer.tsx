import { TrendingUp, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer id="contato" className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Brand */}
          <div>
            <div className={styles.brand}>
              <div className={styles.brandIconContainer}>
                <TrendingUp className={styles.brandIcon} />
              </div>
              <span className={styles.brandName}>CryptoTrade</span>
            </div>
            <p className={styles.brandDescription}>
              A plataforma de trading de criptomoedas mais confiável e segura do Brasil. 
              Transforme seus investimentos com tecnologia de ponta.
            </p>
            <div className={styles.socialLinks}>
              <a href="#" className={styles.socialLink}>
                <Facebook />
              </a>
              <a href="#" className={styles.socialLink}>
                <Instagram />
              </a>
              <a href="#" className={styles.socialLink}>
                <Twitter />
              </a>
              <a href="#" className={styles.socialLink}>
                <Linkedin />
              </a>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h3 className={styles.heading}>Links Rápidos</h3>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <a href="#recursos">
                  Recursos
                </a>
              </li>
              <li className={styles.listItem}>
                <a href="#como-funciona">
                  Como Funciona
                </a>
              </li>
              <li className={styles.listItem}>
                <a href="#depoimentos">
                  Depoimentos
                </a>
              </li>
              <li className={styles.listItem}>
                <a href="#">
                  Preços
                </a>
              </li>
              <li className={styles.listItem}>
                <a href="#">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h3 className={styles.heading}>Suporte</h3>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <a href="#">
                  Central de Ajuda
                </a>
              </li>
              <li className={styles.listItem}>
                <a href="#">
                  Documentação
                </a>
              </li>
              <li className={styles.listItem}>
                <a href="#">
                  Status da API
                </a>
              </li>
              <li className={styles.listItem}>
                <a href="#">
                  Contato
                </a>
              </li>
              <li className={styles.listItem}>
                <a href="#">
                  Segurança
                </a>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className={styles.heading}>Contato</h3>
            <div className={styles.list}>
              <div className={styles.contactItem}>
                <Mail />
                <span className={styles.contactText}>contato@cryptotrade.com.br</span>
              </div>
              <div className={styles.contactItem}>
                <Phone />
                <span className={styles.contactText}>+55 (11) 3000-0000</span>
              </div>
              <div className={styles.contactItem}>
                <MapPin />
                <span className={styles.contactText}>São Paulo, SP - Brasil</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={styles.bottomSection}>
          <div className={styles.bottomContent}>
            <div className={styles.copyright}>
              © 2024 CryptoTrade. Todos os direitos reservados.
            </div>
            <div className={styles.legalLinks}>
              <a href="#" className={styles.legalLink}>
                Política de Privacidade
              </a>
              <a href="#" className={styles.legalLink}>
                Termos de Uso
              </a>
              <a href="#" className={styles.legalLink}>
                Disclaimer Legal
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
