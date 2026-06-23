/**
 * esDnevnik Grades Calculator Script v1
 * -------------------------------------
 * Bookmarklet za automatsku procenu uspeha učenika na stranici:
 * https://esdnevnik.rs/reports/school-class/students-grades
 * 
 * Računa prosek za svaki predmet (aritmetička sredina ocena),
 * zaključnu ocenu za svaki predmet (zaokruživanje na ceo broj),
 * i opšti uspeh odeljenja i pojedinačnih učenika.
 */

(function () {
    // 1. Provera tabele
    const table = document.querySelector('table');
    if (!table) {
        alert("❌ Nije pronađena tabela sa ocenama na ovoj stranici!\n\nMolimo vas da otvorite stranicu sa ocenama odeljenja na eDnevniku (Izveštaji -> Uspeh po predmetima/učenicima) pa pokrenite skriptu ponovo.");
        return;
    }

    // 2. Detekcija zaglavlja i kolona
    const headerRows = Array.from(table.querySelectorAll('thead tr'));
    if (headerRows.length === 0) {
        alert("❌ Nije pronađeno zaglavlje tabele!");
        return;
    }

    // Koristi se poslednji red u thead jer on sadrži stvarne predmete u slučaju složenih zaglavlja
    const headerCells = Array.from(headerRows[headerRows.length - 1].querySelectorAll('th, td'));
    const headers = headerCells.map(cell => cell.textContent.trim());

    let nameColIndex = -1;
    let indexColIndex = -1;
    const subjectCols = [];
    const excludeKeywords = ['jmbg', 'jisp', 'smer', 'delovodni', 'prosek', 'uspeh', 'napomena', 'akcije', 'izostanci', 'opravdani', 'neopravdani', 'vladanje'];
    let vladanjeColIndex = -1;

    headers.forEach((h, idx) => {
        const hLower = h.toLowerCase();
        if (hLower.includes('učenik') || hLower.includes('ucenik') || hLower.includes('prezime i ime') || hLower.includes('ime i prezime') || hLower === 'učenik / učenica') {
            nameColIndex = idx;
        } else if (hLower.includes('r. br') || hLower.includes('r.br') || hLower.includes('rb') || hLower === 'br.' || hLower === '#') {
            indexColIndex = idx;
        } else if (hLower.includes('vladanje')) {
            vladanjeColIndex = idx;
        } else {
            const shouldExclude = excludeKeywords.some(kw => hLower.includes(kw));
            if (h && !shouldExclude) {
                subjectCols.push({ index: idx, name: h });
            }
        }
    });

    if (nameColIndex === -1) {
        nameColIndex = indexColIndex === 0 ? 1 : 0;
    }

    // 3. Pomoćna funkcija za čitanje ocena iz ćelije
    function parseGradesFromCell(cell) {
        if (!cell) return [];
        const temp = cell.cloneNode(true);
        // Ukloni tooltipove, skrivene elemente ili popovere ako postoje
        temp.querySelectorAll('.tooltip, .popover, .hidden, [style*="display: none"]').forEach(el => el.remove());
        
        let text = temp.textContent || temp.innerText || '';
        // Ukloni zagrade i sve unutar njih (npr. datumi ocena poput "(12.10)") kako ne bi ometali detekciju ocena
        text = text.replace(/\([^)]+\)/g, ' ');
        // Zameni zareze, kose crte, nove redove razmacima
        text = text.replace(/[,/\n\r\t]/g, ' ');
        
        // Pokušaj da nađeš pojedinačne brojeve od 1 do 5 koji su odvojeni
        const matches = text.match(/\b[1-5]\b/g) || [];
        if (matches.length === 0) {
            // Ako nema čistih poklapanja sa granicama reči, uzmi sve cifre 1-5 iz teksta
            const digits = text.replace(/[^1-5]/g, '');
            return Array.from(digits).map(Number);
        }
        return matches.map(Number);
    }

    // 4. Prikupljanje podataka o učenicima
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    const studentsData = [];

    rows.forEach((row, rowIdx) => {
        const cols = Array.from(row.querySelectorAll('td, th'));
        if (cols.length <= Math.max(nameColIndex, indexColIndex)) return;
        
        const name = cols[nameColIndex]?.textContent.trim().replace(/\s+/g, ' ') || `Učenik ${rowIdx + 1}`;
        const rBr = cols[indexColIndex]?.textContent.trim() || (rowIdx + 1).toString();
        
        // Vladanje
        let vladanjeOcena = null;
        if (vladanjeColIndex !== -1) {
            const vGrades = parseGradesFromCell(cols[vladanjeColIndex]);
            if (vGrades.length > 0) {
                vladanjeOcena = vGrades[vGrades.length - 1]; // Poslednja ocena iz vladanja je zaključna
            }
        }

        const subjects = [];
        let sumConcluded = 0;
        let countConcluded = 0;
        let hasInsufficient = false; // provera da li ima jedinicu

        subjectCols.forEach(sub => {
            const cell = cols[sub.index];
            const grades = parseGradesFromCell(cell);
            let average = null;
            let concluded = null;

            if (grades.length > 0) {
                const sum = grades.reduce((a, b) => a + b, 0);
                average = parseFloat((sum / grades.length).toFixed(2));
                
                // Pravilnik o ocenjivanju u srednjim školama:
                // >= 4.50 -> 5
                // >= 3.50 i < 4.50 -> 4
                // >= 2.50 i < 3.50 -> 3
                // >= 1.50 i < 2.50 -> 2
                // < 1.50 -> 1
                if (average >= 4.50) concluded = 5;
                else if (average >= 3.50) concluded = 4;
                else if (average >= 2.50) concluded = 3;
                else if (average >= 1.50) concluded = 2;
                else concluded = 1;

                if (concluded === 1) {
                    hasInsufficient = true;
                }

                sumConcluded += concluded;
                countConcluded++;
            }

            subjects.push({
                name: sub.name,
                grades,
                average,
                concluded
            });
        });

        // Uključivanje vladanja u prosek ako postoji i ako je brojčano ocenjeno (srednje škole)
        if (vladanjeOcena !== null && vladanjeOcena >= 1 && vladanjeOcena <= 5) {
            sumConcluded += vladanjeOcena;
            countConcluded++;
            if (vladanjeOcena === 1) {
                hasInsufficient = true;
            }
        }

        // Proračun opšteg uspeha
        let gpa = null;
        let successName = "Neocenjen";

        if (countConcluded > 0) {
            if (hasInsufficient) {
                gpa = 1.00;
                successName = "Nedovoljan";
            } else {
                gpa = parseFloat((sumConcluded / countConcluded).toFixed(2));
                if (gpa === 5.00) successName = "Odličan (5.00)";
                else if (gpa >= 4.50) successName = "Odličan";
                else if (gpa >= 3.50) successName = "Vrlo dobar";
                else if (gpa >= 2.50) successName = "Dobar";
                else if (gpa >= 2.00) successName = "Dovoljan";
                else successName = "Nedovoljan";
            }
        }

        studentsData.push({
            rBr,
            name,
            vladanje: vladanjeOcena,
            subjects,
            gpa,
            successName,
            hasInsufficient,
            countConcluded
        });
    });

    if (studentsData.length === 0) {
        alert("❌ Nije uspeo uvoz nijednog učenika. Proverite strukturu tabele.");
        return;
    }

    // 5. Proračun statistike odeljenja
    const gradedStudents = studentsData.filter(s => s.gpa !== null);
    const classGpaAverage = gradedStudents.length > 0 
        ? parseFloat((gradedStudents.reduce((acc, s) => acc + s.gpa, 0) / gradedStudents.length).toFixed(2)) 
        : 0;

    const stats = {
        total: studentsData.length,
        graded: gradedStudents.length,
        classGpa: classGpaAverage,
        odlican500: gradedStudents.filter(s => s.gpa === 5.00).length,
        odlican: gradedStudents.filter(s => s.gpa >= 4.50 && s.gpa < 5.00 && !s.hasInsufficient).length,
        vrloDobar: gradedStudents.filter(s => s.gpa >= 3.50 && s.gpa < 4.50 && !s.hasInsufficient).length,
        dobar: gradedStudents.filter(s => s.gpa >= 2.50 && s.gpa < 3.50 && !s.hasInsufficient).length,
        dovoljan: gradedStudents.filter(s => s.gpa >= 2.00 && s.gpa < 2.50 && !s.hasInsufficient).length,
        nedovoljan: gradedStudents.filter(s => s.hasInsufficient || s.gpa === 1.00).length
    };

    // Detektuj naslov odeljenja sa stranice
    const schoolYear = document.querySelector('.school-year-selection a, .btn-year, h1, .breadcrumb')?.textContent?.trim() || "";
    const classNameText = document.querySelector('.page-header-subtitle, h2')?.textContent?.trim() || "Odeljenje";

    // 6. Kreiranje prelepog Overlay UI-ja
    const overlayId = 'grades-calc-overlay-container';
    let existingOverlay = document.getElementById(overlayId);
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = overlayId;
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(10, 15, 30, 0.85);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Segoe UI', Roboto, -apple-system, sans-serif;
        color: #e2e8f0;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        width: 95%;
        max-width: 1400px;
        height: 90vh;
        background: #111827;
        border: 1px solid #374151;
        border-radius: 16px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: modalScaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    // Injekcija CSS ključnih animacija i stilova
    const styleTag = document.createElement('style');
    styleTag.textContent = `
        @keyframes modalScaleIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .g-calc-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        .g-calc-scrollbar::-webkit-scrollbar-track {
            background: #1f2937;
        }
        .g-calc-scrollbar::-webkit-scrollbar-thumb {
            background: #4b5563;
            border-radius: 4px;
        }
        .g-calc-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #6b7280;
        }
        .status-badge {
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .status-odlican-500 { background: rgba(212, 175, 55, 0.2); color: #fbbf24; border: 1px solid rgba(212, 175, 55, 0.4); font-weight: bold; }
        .status-odlican { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
        .status-vrlodobar { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
        .status-dobar { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
        .status-dovoljan { background: rgba(139, 92, 246, 0.2); color: #a78bfa; border: 1px solid rgba(139, 92, 246, 0.3); }
        .status-nedovoljan { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
        
        .g-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
        .g-table th { background: #1f2937; color: #9ca3af; font-weight: 600; padding: 12px 16px; border-bottom: 2px solid #374151; position: sticky; top: 0; z-index: 10; }
        .g-table td { padding: 12px 16px; border-bottom: 1px solid #1f2937; transition: background 0.15s; }
        .g-table tr:hover td { background: #1f2937; }
        
        .action-btn {
            background: #2563eb;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        .action-btn:hover { background: #1d4ed8; transform: translateY(-1px); }
        .action-btn-secondary {
            background: #374151;
            color: #e5e7eb;
            border: 1px solid #4b5563;
        }
        .action-btn-secondary:hover { background: #4b5563; }
        .action-btn-danger {
            background: #dc2626;
        }
        .action-btn-danger:hover { background: #b91c1c; }
        
        .stat-card {
            background: #1f2937;
            border: 1px solid #374151;
            padding: 16px;
            border-radius: 12px;
            text-align: center;
            flex: 1;
            min-width: 150px;
        }
        .stat-val { font-size: 24px; font-weight: 700; margin-top: 4px; color: #f3f4f6; }
        .stat-label { font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
    `;
    document.head.appendChild(styleTag);

    // 7. Popunjavanje Modal HTML-a
    modal.innerHTML = `
        <!-- HEADER -->
        <div style="padding: 20px 24px; background: #1f2937; border-bottom: 1px solid #374151; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #10b981; display: flex; align-items: center; gap: 8px;">
                    <span>📊 Procena uspeha učenika</span>
                    <span style="font-size: 14px; font-weight: 400; color: #9ca3af; background: #111827; padding: 2px 8px; border-radius: 6px;">eDnevnik Helper</span>
                </h2>
                <div style="font-size: 13px; color: #9ca3af; margin-top: 4px;">
                    ${classNameText} | ${schoolYear}
                </div>
            </div>
            <div style="display: flex; gap: 12px;">
                <button id="export-csv" class="action-btn action-btn-secondary">
                    📥 Izvezi CSV (Excel)
                </button>
                <button id="copy-json" class="action-btn">
                    📋 Kopiraj JSON za TSP Alat
                </button>
                <button id="close-overlay" class="action-btn action-btn-danger" style="padding: 8px 12px;">
                    Zatvori
                </button>
            </div>
        </div>

        <!-- STATS BAR -->
        <div style="padding: 20px 24px; background: #111827; display: flex; gap: 16px; flex-wrap: wrap; border-bottom: 1px solid #1f2937;">
            <div class="stat-card" style="border-left: 4px solid #10b981;">
                <div class="stat-label">Srednji prosek odeljenja</div>
                <div class="stat-val" style="color: #34d399;">${stats.classGpa.toFixed(2)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Ukupno učenika</div>
                <div class="stat-val">${stats.total}</div>
            </div>
            <div class="stat-card" style="border-left: 4px solid #fbbf24;">
                <div class="stat-label">Skroz odlični (5.00)</div>
                <div class="stat-val" style="color: #fbbf24;">${stats.odlican500}</div>
            </div>
            <div class="stat-card" style="border-left: 4px solid #34d399;">
                <div class="stat-label">Odlični (4.50-4.99)</div>
                <div class="stat-val" style="color: #34d399;">${stats.odlican}</div>
            </div>
            <div class="stat-card" style="border-left: 4px solid #60a5fa;">
                <div class="stat-label">Vrlo dobri</div>
                <div class="stat-val" style="color: #60a5fa;">${stats.vrloDobar}</div>
            </div>
            <div class="stat-card" style="border-left: 4px solid #fbbf24;">
                <div class="stat-label">Dobri / Dovoljni</div>
                <div class="stat-val" style="color: #fbbf24;">${stats.dobar + stats.dovoljan}</div>
            </div>
            <div class="stat-card" style="border-left: 4px solid #f87171;">
                <div class="stat-label">Nedovoljni (sa jedinicom)</div>
                <div class="stat-val" style="color: #f87171;">${stats.nedovoljan}</div>
            </div>
        </div>

        <!-- SEARCH AND FILTER -->
        <div style="padding: 12px 24px; background: #111827; display: flex; gap: 16px; border-bottom: 1px solid #1f2937; align-items: center;">
            <div style="flex: 1; position: relative;">
                <input id="calc-search" type="text" placeholder="Pretraži učenike po imenu..." style="width: 100%; background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 8px 12px 8px 36px; color: white; outline: none; font-size: 14px;">
                <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9ca3af;">🔍</span>
            </div>
            <select id="calc-filter" style="background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 8px 12px; color: white; outline: none; font-size: 14px;">
                <option value="all">Svi uspesi</option>
                <option value="odlican500">Skroz odlični (5.00)</option>
                <option value="odlican">Odlični (4.50 - 4.99)</option>
                <option value="vrlodobar">Vrlo dobri</option>
                <option value="dobardovoljan">Dobri / Dovoljni</option>
                <option value="nedovoljan">Nedovoljni (sa jedinicom)</option>
            </select>
        </div>

        <!-- MAIN TABLE CONTAINER -->
        <div class="g-calc-scrollbar" style="flex: 1; overflow-y: auto; background: #0b0f19;">
            <table class="g-table">
                <thead>
                    <tr>
                        <th style="width: 60px; text-align: center;">R. br.</th>
                        <th>Prezime i ime</th>
                        <th>Predmeti sa ocenama i prosekom</th>
                        <th style="width: 100px; text-align: center;">Vladanje</th>
                        <th style="width: 120px; text-align: right;">Prosek</th>
                        <th style="width: 150px; text-align: center;">Uspeh</th>
                    </tr>
                </thead>
                <tbody id="students-tbody">
                    <!-- Dinamički ubačeni redovi -->
                </tbody>
            </table>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const tbody = modal.querySelector('#students-tbody');

    // 8. Prikazivanje redova u tabeli
    function renderStudents(filterText = '', successFilter = 'all') {
        tbody.innerHTML = '';
        
        let filtered = studentsData.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(filterText.toLowerCase());
            
            if (successFilter === 'all') return matchesSearch;
            if (successFilter === 'odlican500') return matchesSearch && s.successName === 'Odličan (5.00)';
            if (successFilter === 'odlican') return matchesSearch && s.successName === 'Odličan';
            if (successFilter === 'vrlodobar') return matchesSearch && s.successName === 'Vrlo dobar';
            if (successFilter === 'dobardovoljan') return matchesSearch && (s.successName === 'Dobar' || s.successName === 'Dovoljan');
            if (successFilter === 'nedovoljan') return matchesSearch && s.hasInsufficient;
            return matchesSearch;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #9ca3af; font-size: 15px;">
                        Nema učenika koji odgovaraju zadatim kriterijumima pretrage.
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach(student => {
            const tr = document.createElement('tr');
            
            // Uspeh klasa za boju
            let badgeClass = 'status-odlican';
            if (student.successName === 'Odličan (5.00)') badgeClass = 'status-odlican-500';
            else if (student.successName === 'Vrlo dobar') badgeClass = 'status-vrlodobar';
            else if (student.successName === 'Dobar') badgeClass = 'status-dobar';
            else if (student.successName === 'Dovoljan') badgeClass = 'status-dovoljan';
            else if (student.successName === 'Nedovoljan') badgeClass = 'status-nedovoljan';

            // Prikaz ocena po predmetima u kompaktnoj listi
            const subjectsHtml = student.subjects.map(sub => {
                if (sub.grades.length === 0) return '';
                const hasOne = sub.concluded === 1;
                const style = hasOne ? 'color: #f87171; font-weight: bold; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2);' : 'background: #1f2937;';
                return `
                    <div style="display: inline-flex; align-items: center; gap: 4px; margin: 2px 4px; padding: 4px 8px; border-radius: 6px; font-size: 12px; ${style}">
                        <span style="color: #9ca3af; font-weight: 500;">${sub.name}:</span>
                        <span style="font-weight: 600;">[${sub.grades.join(', ')}]</span>
                        <span style="color: #10b981; font-weight: bold; margin-left: 2px;">Ø ${sub.average.toFixed(2)}</span>
                        ${sub.concluded ? `<span style="color: #60a5fa; font-weight: bold; font-size: 11px;">(Zaključeno: ${sub.concluded})</span>` : ''}
                    </div>
                `;
            }).filter(h => h !== '').join('');

            tr.innerHTML = `
                <td style="text-align: center; font-weight: 600; color: #9ca3af;">${student.rBr}</td>
                <td style="font-weight: 600; color: #f3f4f6;">${student.name}</td>
                <td style="padding: 10px 16px;"><div style="display: flex; flex-wrap: wrap; gap: 2px;">${subjectsHtml || '<span style="color: #4b5563; font-style: italic;">Nema unetih ocena</span>'}</div></td>
                <td style="text-align: center;">
                    ${student.vladanje !== null 
                        ? `<span class="status-badge ${student.vladanje === 1 ? 'status-nedovoljan' : 'status-odlican'}" style="font-weight: bold;">${student.vladanje}</span>` 
                        : '<span style="color:#4b5563;">/</span>'}
                </td>
                <td style="text-align: right; font-weight: 700; font-size: 16px; color: ${student.hasInsufficient ? '#f87171' : '#34d399'};">
                    ${student.gpa !== null ? student.gpa.toFixed(2) : '/'}
                </td>
                <td style="text-align: center;">
                    <span class="status-badge ${badgeClass}">${student.successName}</span>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    renderStudents();

    // Event listeneri za pretragu i filtriranje
    const searchInput = modal.querySelector('#calc-search');
    const filterSelect = modal.querySelector('#calc-filter');

    searchInput.addEventListener('input', (e) => {
        renderStudents(e.target.value, filterSelect.value);
    });

    filterSelect.addEventListener('change', (e) => {
        renderStudents(searchInput.value, e.target.value);
    });

    // 9. EVENT HANDLERI ZA DUGMAD

    // Close
    modal.querySelector('#close-overlay').onclick = () => {
        overlay.remove();
    };

    // Copy JSON
    const copyBtn = modal.querySelector('#copy-json');
    copyBtn.onclick = () => {
        const payload = {
            skolskaGodina: schoolYear,
            odeljenje: classNameText,
            datumProracuna: new Date().toISOString().split('T')[0],
            statistika: stats,
            ucenici: studentsData
        };
        
        const jsonStr = JSON.stringify(payload, null, 2);
        
        try {
            const el = document.createElement('textarea');
            el.value = jsonStr;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            
            copyBtn.innerText = "✅ Kopirano!";
            copyBtn.style.background = "#10b981";
            setTimeout(() => {
                copyBtn.innerText = "📋 Kopiraj JSON za TSP Alat";
                copyBtn.style.background = "#2563eb";
            }, 2000);
        } catch (err) {
            alert("Greška pri kopiranju u clipboard. Kopirajte ručno iz konzole.");
            console.log(jsonStr);
        }
    };

    // Export CSV
    modal.querySelector('#export-csv').onclick = () => {
        // Generisanje zaglavlja za CSV (R. br., Ime i prezime, Vladanje, Prosek, Uspeh + predmeti)
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        
        const csvHeaders = ["R. br.", "Ime i prezime", "Vladanje", "Prosečna ocena", "Opšti uspeh"];
        subjectCols.forEach(sub => {
            csvHeaders.push(`${sub.name} (Ocene)`, `${sub.name} (Prosek)`, `${sub.name} (Zaključna)`);
        });

        csvContent += csvHeaders.map(h => `"${h.replace(/"/g, '""')}"`).join(";") + "\n";

        studentsData.forEach(student => {
            const rowData = [
                student.rBr,
                student.name,
                student.vladanje !== null ? student.vladanje : "",
                student.gpa !== null ? student.gpa.toFixed(2) : "",
                student.successName
            ];

            subjectCols.forEach(sub => {
                const subData = student.subjects.find(s => s.name === sub.name);
                if (subData && subData.grades.length > 0) {
                    rowData.push(
                        `"${subData.grades.join(', ')}"`,
                        subData.average.toFixed(2),
                        subData.concluded
                    );
                } else {
                    rowData.push("", "", "");
                }
            });

            csvContent += rowData.join(";") + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        
        const safeClassName = classNameText.replace(/[^a-zA-Z0-9]/g, "_");
        link.setAttribute("download", `Uspeh_Ucenika_${safeClassName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

})();
