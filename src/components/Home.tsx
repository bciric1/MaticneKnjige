import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Printer, ChevronRight, HelpCircle, Download, MousePointer2 } from 'lucide-react';
import './Home.css';

const SCRAPER_CODE = `(async function () {
    let table = document.querySelector('table');
    if (!table) {
        await new Promise(r => setTimeout(r, 1000));
        table = document.querySelector('table');
        if (!table) {
            alert("❌ Nije pronađena tabela sa učenicima! Idite na spisak učenika u okviru svog odeljenja pa pokrenite skriptu ponovo.");
            return;
        }
    }
    const headerText = document.querySelector('h1, .page-header-title, .breadcrumb')?.innerText || "";
    const subtitleText = document.querySelector('.page-header-subtitle')?.innerText || "";
    const subMatch = subtitleText.match(/Разреднo одељењe:\\s*([IVX1-9]+)\\s+(\\d+)/i);
    const detectedRazred = subMatch ? subMatch[1] : (headerText.match(/([IVX1-9]+)[\\-\\/](\\d+)/)?.[1] || "I");
    const detectedOdeljenje = subMatch ? subMatch[2] : (headerText.match(/([IVX1-9]+)[\\-\\/](\\d+)/)?.[2] || "1");
    const yearMatch = headerText.match(/(\\d{4})\\/(\\d{2,4})/) || subtitleText.match(/(\\d{4})\\/(\\d{2,4})/);
    let suggestedYear = "2025/2026";
    if (yearMatch) {
        const y1 = yearMatch[1];
        let y2 = yearMatch[2];
        if (y2.length === 2) y2 = "20" + y2;
        suggestedYear = \`\${y1}/\${y2}\`;
    }
    const userRazred = prompt("Unesite RAZRED (npr. I, II, III, IV):", detectedRazred);
    const userOdeljenje = prompt("Unesite ODELJENJE (broj):", detectedOdeljenje);
    const userSkolskaGodina = prompt("Unesite ŠKOLSKU GODINU (u formatu 2025/2026):", suggestedYear);
    if (!userRazred || !userOdeljenje || !userSkolskaGodina) return;

    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText.trim().toLowerCase());
    const rows = Array.from(table.querySelectorAll('tbody tr')).filter(r => r.innerText.trim() !== "");
    const getIndex = (label) => headers.findIndex(h => h.includes(label.toLowerCase()));
    const idxUcenik = getIndex('ученик') !== -1 ? getIndex('ученик') : 1;
    const idxJmbg = getIndex('јмбг') !== -1 ? getIndex('јмбг') : 2;
    const idxSmer = getIndex('смер') !== -1 ? getIndex('смер') : 5;
    const idxJisp = getIndex('јисп') !== -1 ? getIndex('јисп') : 6;
    const idxBroj = getIndex('деловодни') !== -1 ? getIndex('деловодни') : 7;
    const romanMap = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, '1': 1, '2': 2, '3': 3, '4': 4 };
    const romanToCyrillic = { 'I': 'први', 'II': 'други', 'III': 'трећи', 'IV': 'четврти' };
    const numYear = romanMap[userRazred.toUpperCase().trim()] || 1;
    const cyrillicRazred = romanToCyrillic[userRazred.toUpperCase().trim()] || userRazred.toLowerCase();
    const students = [];
    const delay = ms => new Promise(res => setTimeout(res, ms));
    const progressDiv = document.createElement('div');
    progressDiv.style.cssText = "position:fixed; top:20px; right:20px; background:#1e1e1e; color:#fff; padding:15px; border-radius:8px; z-index:99999; border:1px solid #444; font-family:sans-serif; box-shadow:0 5px 15px rgba(0,0,0,0.5);";
    document.body.appendChild(progressDiv);

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cols = Array.from(row.querySelectorAll('td'));
        if (cols.length < 2) continue;
        const studentLink = cols[idxUcenik].querySelector('a');
        if (!studentLink) continue;
        const studentId = studentLink.getAttribute('href').split('/').pop();
        const punoIme = studentLink.innerText.trim().replace(/\\s+/g, ' ');
        const redniBroj = cols[0]?.innerText.trim() || (i + 1).toString();
        progressDiv.innerHTML = \`⏳ Obrađujem (\${i + 1}/\${rows.length}):<br><b>\${punoIme}</b>\`;
        let student = {
            id: studentId,
            brObrasca: (() => {
                const padRedniBroj = String(redniBroj).padStart(2, '0');
                const padOdeljenje = String(userOdeljenje).padStart(2, '0');
                const startYearFull = parseInt(userSkolskaGodina.split(/[\\/\\-]/)[0]) || new Date().getFullYear();
                const enrollmentYearShort = String(startYearFull - (numYear - 1)).substring(2);
                return \`\${padRedniBroj}1\${padOdeljenje}\${enrollmentYearShort}\`;
            })(),
            prezime: punoIme.split(' ')[0],
            ime: punoIme.split(' ').slice(1).join(' '),
            jmbg: cols[idxJmbg]?.innerText.trim().substring(0, 13) || "",
            job: cols[idxJmbg]?.innerText.trim().length > 13 ? cols[idxJmbg].innerText.trim().replace(/\\s+/g, '').substring(13) : "",
            brojURegistru: cols[idxBroj]?.innerText.trim() || "",
            razredUpisa: cyrillicRazred,
            obrazovniProfilSmer: cols[idxSmer]?.innerText.trim().replace(/\\s+/g, ' ').split(/[\\-/:]/)[0].replace(/\\(\\d\\)/g, "").trim(),
            trajanjeObrazovanjaGodina: parseInt(cols[idxSmer]?.innerText.match(/\\((\\d)\\)/)?.[1] || "4"),
            jispProgram: cols[idxJisp]?.innerText.trim().replace(/\\s+/g, ' ') || "",
            razredi: { [numYear]: { predmeti: [], skolskaGodina: userSkolskaGodina, razred: userRazred } }
        };
        try {
            await delay(400);
            const profileHtml = await (await fetch("/gradebook/" + studentId + "/personal-info")).text();
            const profileDoc = new DOMParser().parseFromString(profileHtml, 'text/html');
            Array.from(profileDoc.querySelectorAll('dt')).forEach(dt => {
                const label = dt.innerText.toLowerCase();
                const val = dt.nextElementSibling?.innerText.trim().replace(/\\s+/g, ' ');
                if (label.includes("датум рођења")) {
                    const dParts = val.split('(')[0].trim().split('.').filter(x => x.trim());
                    if (dParts.length >= 3) student.datumRodjenja = \`\${dParts[2].trim()}-\${dParts[1].trim().padStart(2, '0')}-\${dParts[0].trim().padStart(2, '0')}\`;
                }
                if (label.includes("место рођења")) {
                    const parts = val.split(',');
                    const placeMatch = parts[0]?.match(/([^(]+)(?:\\(([^)]+)\\))?/);
                    student.mestoRodjenja = placeMatch?.[1]?.trim() || "";
                    student.opstinaRodjenja = placeMatch?.[2]?.trim() || "";
                    student.drzavaRodjenja = parts[1]?.trim() || "Srbija";
                }
            });
            student.skolaUpisa = "Srednja tehnička škola";
            const contactHtml = await (await fetch("/admin-class/students/contacts/" + studentId)).text();
            const contactDoc = new DOMParser().parseFromString(contactHtml, 'text/html');
            let roditelji = [];
            Array.from(contactDoc.querySelectorAll('.table-resource tbody tr')).forEach(cRow => {
                const td = cRow.querySelector('td');
                if (td) roditelji.push(td.innerText.replace(/отац|мајка|родитељ|старатељ/gi, '').trim().replace(/\\s+/g, ' '));
            });
            student.imeRoditeljaStaratelja = roditelji.filter(x=>x).join(', ');
            const gradesHtml = await (await fetch("/gradebook/" + studentId + "/final-grades")).text();
            const gradeDoc = new DOMParser().parseFromString(gradesHtml, 'text/html');
            Array.from(gradeDoc.querySelectorAll('.table-report tbody tr')).forEach(grRow => {
                const cells = Array.from(grRow.querySelectorAll('td'));
                if (cells.length >= 2) {
                    let naziv = cells[0].innerText.trim().replace(/\\s+/g, ' ').replace(/\\s*\\(обавезан изборни[^)]*\\)/gi, '').trim();
                    const ocenaRaw = cells[1]?.innerText.trim();
                    if (naziv === "Владање") student.razredi[numYear].vladanje = ocenaRaw;
                    else if (naziv === "Општи успех") {
                        student.razredi[numYear].opstiUspeh = ocenaRaw.split('(')[0].trim();
                        student.razredi[numYear].prosecnaOcena = ocenaRaw.match(/\\(([^)]+)\\)/)?.[1] || "";
                    } else if (naziv && naziv !== "Предмет" && ocenaRaw && ocenaRaw !== "/") {
                        student.razredi[numYear].predmeti.push({ naziv, ocena: ocenaRaw.match(/\\((\\d+)\\)/)?.[1] || ocenaRaw });
                    }
                }
            });
        } catch (e) { }
        students.push(student);
    }
    document.body.removeChild(progressDiv);
    const json = JSON.stringify(students, null, 2);
    const overlay = document.createElement('div');
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:100000; display:flex; align-items:center; justify-content:center; font-family:sans-serif;";
    overlay.innerHTML = \`<div style="background:#222; color:#fff; padding:30px; border-radius:15px; width:90%; max-width:900px; max-height:90vh; display:flex; flex-direction:column; gap:20px; border:1px solid #444;">
        <div style="display:flex; justify-content:space-between; align-items:center;"><h2 style="margin:0; color:#4ade80;">✅ Ekstrakcija završena!</h2></div>
        <textarea readonly style="flex:1; background:#000; color:#00ff00; border:1px solid #333; padding:15px; font-family:monospace; font-size:13px; border-radius:8px; resize:none;">\${json}</textarea>
        <div style="display:flex; gap:15px;">
            <button id="copy-btn" style="flex:2; background:#3b82f6; color:#fff; border:none; padding:15px; border-radius:8px; font-weight:bold; cursor:pointer;">📋 KOPIRAJ PODATKE</button>
            <button id="close-btn" style="flex:1; background:#444; color:#fff; border:none; padding:15px; border-radius:8px; font-weight:bold; cursor:pointer;">ZATVORI</button>
        </div>
    </div>\`;
    document.body.appendChild(overlay);
    overlay.querySelector('#copy-btn').onclick = () => {
        overlay.querySelector('textarea').select();
        document.execCommand('copy');
        alert("✅ Kopirano!");
    };
    overlay.querySelector('#close-btn').onclick = () => document.body.removeChild(overlay);
})();\`;

interface HomeProps {
  onStartTool: () => void;
}

export const Home: React.FC<HomeProps> = ({ onStartTool }) => {
  const bookmarklet = \`javascript:\${encodeURIComponent(SCRAPER_CODE)}\`;

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
          
          <a href={bookmarklet} className="bookmarklet-btn" onClick={(e) => e.preventDefault()}>
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
