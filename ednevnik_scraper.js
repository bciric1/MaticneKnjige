/**
 * esDnevnik Scraper Script v7
 * -----------------------
 * Poboljšano kopiranje podataka i automatska detekcija godine/odeljenja.
 */

(async function () {
    // 1. Provera da li smo na pravoj stranici
    let table = document.querySelector('table');

    if (!table) {
        const yearButtons = document.querySelectorAll('.school-year-selection a, .btn-year');
        if (yearButtons.length > 0) {
            alert("⚠️ Molimo prvo izaberite školsku godinu na stranici, pa tek onda pokrenite skriptu.");
            return;
        }

        // Sačekaj sekundu ako se stranica još učitava
        await new Promise(r => setTimeout(r, 1000));
        table = document.querySelector('table');

        if (!table) {
            alert("❌ Nije pronađena tabela sa učenicima!\n\nIdite na spisak učenika u okviru svog odeljenja pa pokrenite skriptu ponovo.");
            return;
        }
    }

    // 2. Automatska detekcija podataka
    const headerText = document.querySelector('h1, .page-header-title, .breadcrumb')?.innerText || "";
    const subtitleText = document.querySelector('.page-header-subtitle')?.innerText || "";

    // Detekcija odeljenja iz subtitle: "Разреднo одељењe: I 1" -> Razred: I, Odeljenje: 1
    const subMatch = subtitleText.match(/Разреднo одељењe:\s*([IVX1-9]+)\s+(\d+)/i);
    const detectedRazred = subMatch ? subMatch[1] : (headerText.match(/([IVX1-9]+)[\-\/](\d+)/)?.[1] || "I");
    const detectedOdeljenje = subMatch ? subMatch[2] : (headerText.match(/([IVX1-9]+)[\-\/](\d+)/)?.[2] || "1");

    // Detekcija školske godine: "2024/2025" -> "2024/2025"
    const yearMatch = headerText.match(/(\d{4})\/(\d{2,4})/) || subtitleText.match(/(\d{4})\/(\d{2,4})/);
    let suggestedYear = "2025/2026";
    if (yearMatch) {
        const y1 = yearMatch[1];
        let y2 = yearMatch[2];
        if (y2.length === 2) y2 = "20" + y2;
        suggestedYear = `${y1}/${y2}`;
    }

    // 3. KORISNIČKI UNOS
    const userRazred = prompt("Unesite RAZRED (npr. I, II, III, IV):", detectedRazred);
    const userOdeljenje = prompt("Unesite ODELJENJE (broj):", detectedOdeljenje);
    const userSkolskaGodina = prompt("Unesite ŠKOLSKU GODINU (u formatu 2025/2026):", suggestedYear);

    if (!userRazred || !userOdeljenje || !userSkolskaGodina) {
        console.log("🚫 Ekstrakcija otkazana.");
        return;
    }

    console.log(`🚀 Pokrećem ekstrakciju za odeljenje ${userRazred}-${userOdeljenje} (${userSkolskaGodina})...`);

    // 4. PRIPREMA ZA EKSTRAKCIJU
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

    const currentYearShort = new Date().getFullYear().toString().substring(2);
    const students = [];
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // Kreiranje progress indicatora
    const progressDiv = document.createElement('div');
    progressDiv.style.cssText = "position:fixed; top:20px; right:20px; background:#1e1e1e; color:#fff; padding:15px; border-radius:8px; z-index:99999; border:1px solid #444; font-family:sans-serif; box-shadow:0 5px 15px rgba(0,0,0,0.5);";
    document.body.appendChild(progressDiv);

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cols = Array.from(row.querySelectorAll('td'));
        if (cols.length < 2) continue;

        const ucenikCell = cols[idxUcenik];
        const studentLink = ucenikCell.querySelector('a');
        if (!studentLink) continue;

        const studentId = studentLink.getAttribute('href').split('/').pop();
        const punoIme = studentLink.innerText.trim().replace(/\s+/g, ' ');
        const redniBroj = cols[0]?.innerText.trim() || (i + 1).toString();

        progressDiv.innerHTML = `⏳ Obrađujem (${i + 1}/${rows.length}):<br><b>${punoIme}</b>`;
        console.log(`⏳ (${i + 1}/${rows.length}) Obrađujem: ${punoIme}`);

        let student = {
            id: studentId,
            brObrasca: (() => {
                const padRedniBroj = String(redniBroj).padStart(2, '0');
                const padOdeljenje = String(userOdeljenje).padStart(2, '0');
                const startYearFull = parseInt(userSkolskaGodina.split(/[\/\-]/)[0]) || new Date().getFullYear();
                const enrollmentYearFull = startYearFull - (numYear - 1);
                const enrollmentYearShort = String(enrollmentYearFull).substring(2);
                return `${padRedniBroj}1${padOdeljenje}${enrollmentYearShort}`;
            })(),
            prezime: punoIme.split(' ')[0],
            ime: punoIme.split(' ').slice(1).join(' '),
            jmbg: cols[idxJmbg]?.innerText.trim().substring(0, 13) || "",
            job: cols[idxJmbg]?.innerText.trim().length > 13 ? cols[idxJmbg].innerText.trim().replace(/\s+/g, '').substring(13) : "",
            brojURegistru: cols[idxBroj]?.innerText.trim() || "",
            razredUpisa: cyrillicRazred,
            obrazovniProfilSmer: (() => {
                const raw = cols[idxSmer]?.innerText.trim().replace(/\s+/g, ' ');
                let s = raw.split(/[-/:]/)[0].replace(/\(\d\)/g, "").replace(/\d{4}/g, "").trim();

                // Robusna deduplifikacija reči
                const words = s.split(/\s+/).filter(x => x.length > 0);
                if (words.length >= 2 && words.length % 2 === 0) {
                    const mid = words.length / 2;
                    if (words.slice(0, mid).join(' ') === words.slice(mid).join(' ')) {
                        s = words.slice(0, mid).join(' ');
                    }
                }
                // Robusna deduplifikacija karaktera (za svaki slučaj)
                const len = s.length;
                if (len > 10) {
                    const half = Math.floor(len / 2);
                    const s1 = s.substring(0, half).trim();
                    const s2 = s.substring(len - s1.length).trim();
                    if (s1 === s2) s = s1;
                }
                return s;
            })(),
            smer: (() => {
                const raw = cols[idxSmer]?.innerText.trim().replace(/\s+/g, ' ');
                const parts = raw.split(/[-/:]/);
                if (parts.length < 2) return "";
                let s = parts[1].replace(/\(\d\)/g, "").replace(/\d{4}/g, "").trim();
                // Ista deduplifikacija za svaki slučaj
                const words = s.split(/\s+/).filter(x => x.length > 0);
                if (words.length >= 2 && words.length % 2 === 0) {
                    const mid = words.length / 2;
                    if (words.slice(0, mid).join(' ') === words.slice(mid).join(' ')) s = words.slice(0, mid).join(' ');
                }
                return s;
            })(),
            trajanjeObrazovanjaGodina: parseInt(cols[idxSmer]?.innerText.match(/\((\d)\)/)?.[1] || "4"),
            jispProgram: cols[idxJisp]?.innerText.trim().replace(/\s+/g, ' ') || "",
            razredi: { [numYear]: { predmeti: [], skolskaGodina: userSkolskaGodina, razred: userRazred } }
        };

        try {
            await delay(400);

            // 1. LIČNI PODACI (Personal Info)
            const profileRes = await fetch("/gradebook/" + studentId + "/personal-info");
            const profileHtml = await profileRes.text();
            const profileDoc = new DOMParser().parseFromString(profileHtml, 'text/html');

            const dts = Array.from(profileDoc.querySelectorAll('dt'));
            dts.forEach(dt => {
                const label = dt.innerText.toLowerCase();
                const dd = dt.nextElementSibling;
                if (!dd) return;
                const val = dd.innerText.trim().replace(/\s+/g, ' ');

                if (label.includes("датум рођења")) {
                    // "15. 2. 2011. (15)" -> "2011-02-15"
                    const dParts = val.split('(')[0].trim().split('.').filter(x => x.trim());
                    if (dParts.length >= 3) {
                        const d = dParts[0].trim().padStart(2, '0');
                        const m = dParts[1].trim().padStart(2, '0');
                        const y = dParts[2].trim();
                        student.datumRodjenja = `${y}-${m}-${d}`;
                    }
                }
                if (label.includes("место рођења")) {
                    // "Београд (Савски венац), Република Србија"
                    const parts = val.split(',');
                    const placeMatch = parts[0]?.match(/([^(]+)(?:\(([^)]+)\))?/);
                    student.mestoRodjenja = placeMatch?.[1]?.trim() || parts[0]?.trim() || "";
                    student.opstinaRodjenja = placeMatch?.[2]?.trim() || "";
                    student.drzavaRodjenja = parts[1]?.trim() || "Srbija";
                }
            });

            student.skolaUpisa = "Srednja tehnička škola";

            // 2. RODITELJI
            const contactRes = await fetch("/admin-class/students/contacts/" + studentId);
            const contactHtml = await contactRes.text();
            const contactDoc = new DOMParser().parseFromString(contactHtml, 'text/html');
            const contactRows = Array.from(contactDoc.querySelectorAll('.table-resource tbody tr'));
            let roditelji = [];
            contactRows.forEach(cRow => {
                const td = cRow.querySelector('td');
                if (td) {
                    let name = td.innerText.replace(/отац|мајка|родитељ|старатељ/gi, '').trim().replace(/\s+/g, ' ');
                    if (name) roditelji.push(name);
                }
            });
            student.imeRoditeljaStaratelja = roditelji.join(', ');

            // 3. OCENE
            const gradesRes = await fetch("/gradebook/" + studentId + "/final-grades");
            const gradesHtml = await gradesRes.text();
            const gradeDoc = new DOMParser().parseFromString(gradesHtml, 'text/html');
            const gradeRows = Array.from(gradeDoc.querySelectorAll('.table-report tbody tr'));
            
            // Dinamička detekcija kolona po hederima
            const gradeHeaders = Array.from(gradeDoc.querySelectorAll('.table-report th')).map(th => th.innerText.trim().toLowerCase());
            const idxAvgust = gradeHeaders.findIndex(h => h.includes('31.') || h.includes('avgust') || h.includes('август'));
            const idxZakljucna = gradeHeaders.findIndex(h => h.includes('закључ') || h.includes('zakljuc') || h.includes('конач') || h.includes('konac'));
            const idxDrugo = gradeHeaders.findIndex(h => h.includes('drugo') || h.includes('друго'));
            const idxPrvo = gradeHeaders.findIndex(h => h.includes('prvo') || h.includes('прво'));
            console.log(`[Scraper] Student ID: ${studentId}, Hederi:`, gradeHeaders, `Indeksi -> Avgust: ${idxAvgust}, Zakljucna: ${idxZakljucna}, Drugo: ${idxDrugo}, Prvo: ${idxPrvo}`);

            gradeRows.forEach(grRow => {
                const cells = Array.from(grRow.querySelectorAll('td'));
                
                if (cells.length >= 2) {
                    let naziv = cells[0].innerText.trim().replace(/\s+/g, ' ');
                    
                    // Ukloni tekst "(обавезан izborni predmet)"
                    naziv = naziv.replace(/\s*\(обавезан изборни predmet\)/gi, '')
                                 .replace(/\s*\(обавезан изборни\)/gi, '')
                                 .replace(/\s*\(обавезни изборни програм\)/gi, '')
                                 .replace(/\s*\(обавезни изборни\)/gi, '')
                                 .trim();
                    
                    // Funkcija za bezbedno čitanje ocene
                    const getGradeFromIndex = (idx) => {
                        if (idx !== -1 && cells[idx]) {
                            const val = cells[idx].innerText.trim();
                            if (val && val !== "/" && val !== "-") {
                                return val;
                            }
                        }
                        return null;
                    };

                    // Prioritet: 31. avgust -> Zaključna -> Drugo polugodje -> Prvo polugodje
                    let ocenaRaw = getGradeFromIndex(idxAvgust);
                    if (!ocenaRaw) ocenaRaw = getGradeFromIndex(idxZakljucna);
                    if (!ocenaRaw) ocenaRaw = getGradeFromIndex(idxDrugo);
                    if (!ocenaRaw) ocenaRaw = getGradeFromIndex(idxPrvo);

                    // Krajnji fallback ako ništa nije pronađeno
                    if (!ocenaRaw) {
                        let fallbackIdx = 2;
                        if (cells.length >= 5) fallbackIdx = 4;
                        else if (cells.length >= 4) fallbackIdx = 3;
                        ocenaRaw = cells[fallbackIdx]?.innerText.trim() || "";
                    }

                    const ocenaNum = ocenaRaw?.match(/\((\d+)\)/)?.[1] || ocenaRaw;
                    
                    if (naziv === "Владање") {
                        student.razredi[numYear].vladanje = ocenaRaw || "";
                    } else if (naziv === "Општи успех") {
                        student.razredi[numYear].opstiUspeh = ocenaRaw ? ocenaRaw.split('(')[0].trim() : "";
                        student.razredi[numYear].prosecnaOcena = ocenaRaw ? (ocenaRaw.match(/\(([^)]+)\)/)?.[1] || "") : "";
                    } else if (naziv && naziv !== "Предмет") {
                        // Učitaj predmet čak i ako nema ocene (ocena će biti prazan string ili "/" ako ne postoji)
                        const finalOcena = (ocenaRaw && ocenaRaw !== "/") ? ocenaNum : "";
                        student.razredi[numYear].predmeti.push({ naziv, ocena: finalOcena });
                    }
                }
            });
        } catch (err) { console.error(err); }

        students.push(student);
    }

    document.body.removeChild(progressDiv);
    showResult(students);

    // FUNKCIJA ZA PRIKAZ REZULTATA
    function showResult(data) {
        const json = JSON.stringify(data, null, 2);
        const overlay = document.createElement('div');
        overlay.id = "scraper-result-overlay";
        overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:100000; display:flex; align-items:center; justify-content:center; font-family:sans-serif;";

        const modal = document.createElement('div');
        modal.style.cssText = "background:#222; color:#fff; padding:30px; border-radius:15px; width:90%; max-width:900px; max-height:90vh; display:flex; flex-direction:column; gap:20px; box-shadow:0 20px 50px rgba(0,0,0,0.5); border:1px solid #444;";

        modal.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h2 style="margin:0; color:#4ade80;">✅ Ekstrakcija završena!</h2>
                <span style="background:#444; padding:5px 12px; border-radius:20px; font-size:12px;">Pronađeno: ${data.length} učenika</span>
            </div>
            <p style="margin:0; color:#aaa; font-size:14px;">Ispod se nalaze podaci u JSON formatu. Kliknite na dugme da biste ih kopirali u clipboard.</p>
            <textarea readonly style="flex:1; background:#000; color:#00ff00; border:1px solid #333; padding:15px; font-family:monospace; font-size:13px; border-radius:8px; resize:none; outline:none;">${json}</textarea>
            <div style="display:flex; gap:15px;">
                <button id="copy-btn" style="flex:2; background:#3b82f6; color:#fff; border:none; padding:15px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:16px; transition:0.2s;">📋 KOPIRAJ PODATKE</button>
                <button id="close-btn" style="flex:1; background:#444; color:#fff; border:none; padding:15px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:16px;">ZATVORI</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const copyBtn = modal.querySelector('#copy-btn');
        copyBtn.onclick = () => {
            const ta = modal.querySelector('textarea');
            ta.select();
            document.execCommand('copy');
            copyBtn.innerText = "✅ KOPIRANO U CLIPBOARD!";
            copyBtn.style.background = "#10b981";
            setTimeout(() => {
                copyBtn.innerText = "📋 KOPIRAJ PODATKE";
                copyBtn.style.background = "#3b82f6";
            }, 2000);
        };

        modal.querySelector('#close-btn').onclick = () => {
            document.body.removeChild(overlay);
        };

        // Takođe pokušaj standardni copy komandu
        try {
            const tempInput = document.createElement("textarea");
            tempInput.value = json;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand("copy");
            document.body.removeChild(tempInput);
            console.log("Data auto-copied to clipboard.");
        } catch (e) { }
    }

})();

