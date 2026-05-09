import React, { useRef, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Printer, ChevronRight, HelpCircle, Download, MousePointer2 } from 'lucide-react';
import './Home.css';

// @ts-ignore
import SCRAPER_CODE from '../../ednevnik_scraper.js?raw';

interface HomeProps {
  onStartTool: () => void;
}

export const Home: React.FC<HomeProps> = ({ onStartTool }) => {
  const bookmarklet = `javascript:${encodeURIComponent(SCRAPER_CODE)}`;
  const linkRef = useRef<HTMLAnchorElement>(null);

  useLayoutEffect(() => {
    if (linkRef.current) {
      linkRef.current.setAttribute('href', bookmarklet);
    }
  }, [bookmarklet]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      className="home-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <header className="home-hero">
        <motion.h1 variants={itemVariants} className="home-hero-title">
          Dobrodošli u <span className="text-gradient">TSP Digitalne Alate</span>
        </motion.h1>
        <motion.p variants={itemVariants} className="home-hero-subtitle">
          Moderni sistem za automatizaciju administrativnih poslova u srednjoj tehničkoj školi.
        </motion.p>
      </header>

      <section className="scraper-install-section">
        <div className="install-content">
          <div className="install-title text-gradient">Jednostavno preuzimanje podataka</div>
          <p className="install-desc">
            Umesto kopiranja koda u konzolu, sada možete koristiti <strong>Bookmarklet</strong>. 
            Samo prevucite dugme ispod u vašu traku sa obeleživačima (Bookmarks bar) i kliknite na njega dok ste na eDnevniku.
          </p>
          
          <a ref={linkRef} className="bookmarklet-btn" onClick={(e) => {
            // Prevent click navigation, but allow dragging
            if (e.currentTarget.getAttribute('href') === '#') e.preventDefault();
          }}>
            <MousePointer2 size={24} />
            Prevucite me u Bookmarks bar
          </a>

          <div className="install-tip">
            <Download size={16} />
            <span>Savet: Pritisnite <strong>Ctrl + Shift + B</strong> ako ne vidite traku sa obeleživačima</span>
          </div>
        </div>
      </section>

      <section className="home-section">
        <motion.h2 variants={itemVariants} className="section-title">Dostupni Alati</motion.h2>
        <motion.div variants={itemVariants} className="tools-grid">
          <div className="tool-card glass animate-hover" onClick={onStartTool}>
            <div className="tool-icon-wrapper">
              <BookOpen size={32} className="tool-icon" />
            </div>
            <div className="tool-content">
              <h3>Matične Knjige</h3>
              <p>Automatizovana štampa i vođenje evidencije matičnih knjiga učenika optimizovano za A3 formulare.</p>
              <div className="tool-footer">
                <span>Pokreni alat</span>
                <ChevronRight size={18} />
              </div>
            </div>
          </div>

          <div className="tool-card glass tool-card-disabled">
            <div className="tool-icon-wrapper">
              <Printer size={32} className="tool-icon" />
            </div>
            <div className="tool-content">
              <h3>Svedočanstva</h3>
              <p>Alat za pripremu i štampu svedočanstava na kraju školske godine. (Uskoro dostupno)</p>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="home-section">
        <motion.h2 variants={itemVariants} className="section-title">Uputstvo za korišćenje</motion.h2>
        <motion.div variants={itemVariants} className="instructions-container glass">
          <div className="instruction-step">
            <div className="step-number">1</div>
            <div className="step-text">
              <h4>Preuzimanje podataka</h4>
              <p>Koristite <strong>eDnevnik Scraper</strong> skriptu na zvaničnom portalu eDnevnika da preuzmete JSON podatke o učenicima.</p>
            </div>
          </div>
          <div className="instruction-step">
            <div className="step-number">2</div>
            <div className="step-text">
              <h4>Uvoz podataka</h4>
              <p>Kliknite na dugme <strong>"Uvoz"</strong> u gornjem meniju i učitajte preuzeti JSON fajl.</p>
            </div>
          </div>
          <div className="instruction-step">
            <div className="step-number">3</div>
            <div className="step-text">
              <h4>Kalibracija štampe</h4>
              <p>Pre prvog štampanja, idite na <strong>"Podešavanja"</strong> i podesite koordinate polja tako da se savršeno uklapaju u vaše papirne formulare.</p>
            </div>
          </div>
          <div className="instruction-step">
            <div className="step-number">4</div>
            <div className="step-text">
              <h4>Štampanje</h4>
              <p>Izaberite učenika sa liste, kliknite na <strong>"Štampa"</strong> i pregledajte izgled. Možete sakriti određena polja klikom na njih pre same štampe.</p>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="home-footer">
        <div className="footer-item">
          <HelpCircle size={18} />
          <span>Tehnička podrška: admin@tsp.edu.rs</span>
        </div>
      </footer>
    </motion.div>
  );
};
