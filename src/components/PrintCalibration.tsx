import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, RotateCcw, MousePointer2 } from 'lucide-react';
import type { Student, PrintCalibrationSettings } from '../types';
import './PrintCalibration.css';

interface Props {
  onBack: () => void;
  mockStudent: Student;
}

// Spisak svih polja sa inicijalnim pozicijama (procenti na A3)
const FIELDS = [
  // STRANA 1
  { id: 'hdr_broj_combined', label: 'Број (збирно)', x: 40, y: 28, page: 1 },
  { id: 'hdr_reg', label: 'Број у регистру', x: 130, y: 28, page: 1 },
  { id: 'hdr_jmbg', label: 'ЈМБГ', x: 235, y: 22, page: 1 },
  { id: 'hdr_job', label: 'ЈОБ', x: 235, y: 36, page: 1 },
  
  { id: 'pers_name', label: 'Име и презиме', x: 120, y: 62, page: 1 },
  { id: 'pers_dob', label: 'Датум рођења', x: 60, y: 78, page: 1 },
  { id: 'pers_place', label: 'Место и општина', x: 155, y: 78, page: 1 },
  { id: 'pers_country', label: 'Држава', x: 255, y: 78, page: 1 },
  { id: 'pers_parents', label: 'Родитељи', x: 145, y: 94, page: 1 },
  
  { id: 'enr_school', label: 'Школа', x: 125, y: 110, page: 1 },
  { id: 'enr_class', label: 'Разред (уписан)', x: 235, y: 110, page: 1 },
  { id: 'enr_profile', label: 'Профил', x: 110, y: 126, page: 1 },
  { id: 'enr_smer', label: 'Смер', x: 110, y: 132, page: 1 },
  { id: 'enr_jisp', label: 'ЈИСП програм', x: 110, y: 138, page: 1 },
  { id: 'enr_duration', label: 'Трајање (год)', x: 250, y: 126, page: 1 },
  { id: 'enr_class_roman', label: 'Разред (римски)', x: 100, y: 130, page: 1 },
  { id: 'status_redovan', label: 'Статус (редован/на)', x: 100, y: 140, page: 1 },
  { id: 'skolska_godina_1', label: 'Школска година 1 (нпр. 2025)', x: 150, y: 140, page: 1 },
  { id: 'skolska_godina_2', label: 'Школска година 2 (нпр. 2026)', x: 180, y: 140, page: 1 },
  
  { id: 'grades_subjects', label: 'Списак предмета', x: 20, y: 150, page: 1 },
  { id: 'grades_y1', label: 'Оцене I год', x: 140, y: 150, page: 1 },
  { id: 'grades_y2', label: 'Оцене II год', x: 165, y: 150, page: 1 },
  { id: 'grades_y3', label: 'Оцене III год', x: 190, y: 150, page: 1 },
  { id: 'grades_y4', label: 'Оцене IV год', x: 215, y: 150, page: 1 },

  // STRANA 2
  { id: 'back_class_roman', label: 'Разред римски (I год)', x: 140, y: 80, page: 2 },
  { id: 'back_skolska_godina_1', label: 'Школска година 1 (I год)', x: 140, y: 85, page: 2 },
  { id: 'back_skolska_godina_2', label: 'Школска година 2 (I год)', x: 140, y: 90, page: 2 },
  { id: 'back_vladanje', label: 'Владање (I год)', x: 140, y: 100, page: 2 },
  { id: 'back_uspeh', label: 'Општи успех (I год)', x: 140, y: 110, page: 2 },
  { id: 'back_prosek', label: 'Просек (I год)', x: 140, y: 120, page: 2 },

  { id: 'adm_ispisnica_br', label: 'Исписница (I год)', x: 140, y: 140, page: 2 },
  { id: 'adm_ispit_br', label: 'Уверење испита (I год)', x: 140, y: 160, page: 2 },
  { id: 'adm_sved_br', label: 'Сведочанство (I год)', x: 140, y: 180, page: 2 },
  { id: 'adm_sved_ser', label: 'Серијски бр. (I год)', x: 140, y: 200, page: 2 },
  { id: 'adm_staresina', label: 'Старешина (I год)', x: 140, y: 220, page: 2 },
  { id: 'extra_awards', label: 'Похвале и награде', x: 50, y: 240, page: 2 },

  { id: 'mat_exam_info', label: 'Матура - рок i година', x: 120, y: 280, page: 2 },
  { id: 'mat_subjects', label: 'Матура - предмети/оцене', x: 200, y: 310, page: 2 },
  { id: 'mat_rad_naziv', label: 'Матура - назив рада', x: 150, y: 350, page: 2 },
  { id: 'mat_rad_ocene', label: 'Матура - оцене рада', x: 220, y: 370, page: 2 },
  { id: 'mat_final_grade', label: 'Матура - коначан успех', x: 220, y: 400, page: 2 },
  { id: 'mat_diploma_br', label: 'Матура - број дипломе', x: 80, y: 420, page: 2 },
  { id: 'mat_diploma_ser', label: 'Матура - серијски број', x: 80, y: 440, page: 2 },
  { id: 'back_napomena', label: 'Напомена (дно)', x: 50, y: 460, page: 2 },
];

const STORAGE_KEY = 'maticna_print_calibration';

function getMockValue(id: string, student: Student) {
  if (!student) return "Primer";
  switch(id) {
    case 'hdr_broj_combined': return (student.brObrasca || '').replace('/', '');
    case 'hdr_reg': return student.brojURegistru || '123';
    case 'hdr_jmbg': return student.jmbg || '1234567890123';
    case 'hdr_job': return student.job || '1234567890123';
    case 'pers_name': return `${student.prezime || 'Презиме'} ${student.ime || 'Име'}`;
    case 'pers_dob': return student.datumRodjenja ? new Date(student.datumRodjenja).toLocaleDateString('sr-RS') : '01.01.2008.';
    case 'pers_place': return `${student.mestoRodjenja || 'Место'}, ${student.opstinaRodjenja || 'Општина'}`;
    case 'pers_country': return student.drzavaRodjenja || 'Србија';
    case 'pers_parents': return student.imeRoditeljaStaratelja || 'Име Родитеља';
    case 'enr_school': return student.skolaUpisa || 'Назив школе';
    case 'enr_class': return student.razredUpisa || 'I-1';
    case 'enr_class_roman': return student.razredi?.[1]?.razred || 'I';
    case 'enr_profile': return student.obrazovniProfilSmer || 'Електротехничар';
    case 'enr_smer': return student.smer || 'Рачунари';
    case 'enr_jisp': return student.jispProgram || '123456';
    case 'enr_duration': return student.trajanjeObrazovanjaGodina?.toString() || '4';
    case 'status_redovan': 
      return (student.jmbg && student.jmbg.length === 13 && parseInt(student.jmbg.charAt(9)) >= 5) ? 'редовна' : 'редован';
    case 'skolska_godina_1':
      return (student.razredi?.[1]?.skolskaGodina || '2025/2026').split(/[\/\-]/)[0] || '2025';
    case 'skolska_godina_2':
      return (student.razredi?.[1]?.skolskaGodina || '2025/2026').split(/[\/\-]/)[1] || '2026';
    case 'grades_subjects': return 'Списак предмета...';
    case 'grades_y1': return 'Оцене I год';
    case 'grades_y2': return 'Оцене II год';
    case 'grades_y3': return 'Оцене III год';
    case 'grades_y4': return 'Оцене IV год';
    
    // Strana 2
    case 'back_class_roman': return 'I';
    case 'back_skolska_godina_1': return '2025';
    case 'back_skolska_godina_2': return '2026';
    case 'back_vladanje': return 'Примерно (5)';
    case 'back_uspeh': return 'Одличан';
    case 'back_prosek': return '4.50';
    case 'adm_ispisnica_br': return '123/23';
    case 'adm_ispit_br': return '456/23';
    case 'adm_sved_br': return '789/23';
    case 'adm_sved_ser': return 'A123456';
    case 'adm_staresina': return 'Потпис';
    case 'extra_awards': return student.pohvaleINagrade || 'Пример похвале';
    case 'mat_exam_info': return `${student.matura?.rokPolaganja || 'Јунски'} ${student.matura?.skolskaGodina || '2023/24'}`;
    case 'mat_subjects': return 'Матура предмети...';
    case 'mat_rad_naziv': return student.matura?.maturskiRad?.nazivRada || 'Назив матурског рада';
    case 'mat_rad_ocene': return 'Оцене рада...';
    case 'mat_final_grade': return 'Одличан (5)';
    case 'mat_diploma_br': return student.matura?.delovodniBrojDiplome || '999/24';
    case 'mat_diploma_ser': return student.matura?.serijskiBrojDiplome || 'M987654';
    case 'back_napomena': return student.napomene || 'Пример напомене';
    
    default: return "Primer";
  }
}

export const PrintCalibration: React.FC<Props> = ({ onBack, mockStudent }) => {
  const [settings, setSettings] = useState<PrintCalibrationSettings>(() => {
    const defaults: PrintCalibrationSettings = {};
    FIELDS.forEach(f => {
      defaults[f.id] = { x: f.x, y: f.y };
    });

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return { ...defaults, ...JSON.parse(saved) };
      } catch (e) {
        return defaults;
      }
    }
    return defaults;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scale, setScale] = useState(0.6);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const isLoaded = true;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trajno čuvanje na svaku promenu settings-a
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Tastatura (strelice)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId) return;
      if (document.activeElement?.tagName === 'INPUT') return;

      const step = e.shiftKey ? 10 : 1; // Brže pomeranje sa Shift
      switch (e.key) {
        case 'ArrowUp': nudge(0, -step); e.preventDefault(); break;
        case 'ArrowDown': nudge(0, step); e.preventDefault(); break;
        case 'ArrowLeft': nudge(-step, 0); e.preventDefault(); break;
        case 'ArrowRight': nudge(step, 0); e.preventDefault(); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, settings]);

  const updatePos = (id: string, x: number, y: number) => {
    setSettings(prev => ({
      ...prev,
      [id]: { x, y }
    }));
  };



  const nudge = (dx: number, dy: number) => {
    if (!selectedId) return;
    const current = settings[selectedId] || { x: 0, y: 0 };
    const step = 0.2; // 0.2 mm korak
    
    updatePos(selectedId, current.x + dx * step, current.y + dy * step);
  };

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pxPerMmX = rect.width / 297;
    const pxPerMmY = rect.height / 420;
    
    setMousePos({
      x: Math.round((e.clientX - rect.left) / pxPerMmX),
      y: Math.round((e.clientY - rect.top) / pxPerMmY)
    });
  };

  const handlePan = (id: string, info: any) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pxPerMmX = rect.width / 297;
    const pxPerMmY = rect.height / 420;

    const current = settings[id] || { x: 0, y: 0 };
    const dx = info.delta.x / pxPerMmX;
    const dy = info.delta.y / pxPerMmY;

    updatePos(id, current.x + dx, current.y + dy);
  };


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBgImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    toast('Sve promene su trajno sačuvane!');
  };

  // Pomoćna funkcija za obaveštenja (zamena za alert)
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleReset = () => {
    if (confirm('Да ли сте сигурни да желите да вратите све на фабричка подешавања?')) {
      const defaults: PrintCalibrationSettings = {};
      FIELDS.forEach(f => {
        defaults[f.id] = { x: f.x, y: f.y };
      });
      setSettings(defaults);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      toast('Враћено na fabrička podešavanja');
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(settings, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maticna_kalibracija_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    toast('Podešavanja su izvežena u fajl');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          setSettings(imported);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
          toast('Podešavanja su uspešno uvežena!');
        } catch (err) {
          alert('Greška pri učitavanju fajla!');
        }
      };
      reader.readAsText(file);
    }
  };

  const [activePage, setActivePage] = useState(1);

  if (!isLoaded) return null;

  const activeFields = FIELDS.filter(f => f.page === activePage);

  return (
    <div className="cal-root">
      <div className="cal-toolbar">
        <div className="cal-t-left">
          <button className="btn-icon" onClick={onBack} title="Назад">
            <ArrowLeft size={20} />
          </button>
          <h1>Подешавање штампе - Страна {activePage}</h1>
          <div className="page-switcher">
            <button className={activePage === 1 ? 'active' : ''} onClick={() => setActivePage(1)}>Страна 1</button>
            <button className={activePage === 2 ? 'active' : ''} onClick={() => setActivePage(2)}>Страна 2</button>
          </div>
        </div>
        <div className="cal-t-actions">
          {toastMsg && <div className="cal-toast">{toastMsg}</div>}
          <input type="file" id="import-cal" style={{ display: 'none' }} accept=".json" onChange={handleImport} />
          <button className="btn-secondary" onClick={() => document.getElementById('import-cal')?.click()}>
            Uvezi backup
          </button>
          <button className="btn-secondary" onClick={handleExport}>
            Izvezi backup
          </button>
          <button className="btn-reset" onClick={handleReset}>
            <RotateCcw size={18} /> Фабрички распоред
          </button>
          <button className="btn-save" onClick={handleSave}>
            <Save size={18} /> Sačuvaj sada
          </button>
        </div>
      </div>

      <div className="cal-main">
        <div className="cal-sidebar">
          <div className="side-section">
            <h3>Подешавање табеле</h3>
            <div className="input-group">
              <label>Висина реда (mm)</label>
              <input 
                type="number" step="0.1" 
                value={settings.gradesRowHeight || 6.5} 
                onChange={(e) => setSettings(prev => ({ ...prev, gradesRowHeight: parseFloat(e.target.value) || 6.5 }))}
              />
            </div>
            <div className="input-group">
              <label>Ширина колоне (mm)</label>
              <input 
                type="number" step="0.1" 
                value={settings.gradesColWidth || 15} 
                onChange={(e) => setSettings(prev => ({ ...prev, gradesColWidth: parseFloat(e.target.value) || 15 }))}
              />
            </div>
          </div>

          <div className="side-section">
            <h3>Izabrano polje</h3>
            {selectedId ? (
              <div className="field-editor">
                <div className="field-name">{FIELDS.find(f => f.id === selectedId)?.label}</div>
                <div className="pos-controls">
                  <div className="pos-grid">
                    <div />
                    <button onClick={() => nudge(0, -1)}>↑</button>
                    <div />
                    <button onClick={() => nudge(-1, 0)}>←</button>
                    <button className="btn-center" onClick={() => setSelectedId(null)}>OK</button>
                    <button onClick={() => nudge(1, 0)}>→</button>
                    <div />
                    <button onClick={() => nudge(0, 1)}>↓</button>
                    <div />
                  </div>
                  <div className="pos-inputs">
                    <div className="input-group">
                      <label>X (mm)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={settings[selectedId]?.x !== undefined ? settings[selectedId].x.toFixed(2) : "0.00"} 
                        onChange={(e) => updatePos(selectedId, parseFloat(e.target.value) || 0, settings[selectedId]?.y || 0)}
                      />
                    </div>
                    <div className="input-group">
                      <label>Y (mm)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={settings[selectedId]?.y !== undefined ? settings[selectedId].y.toFixed(2) : "0.00"} 
                        onChange={(e) => updatePos(selectedId, settings[selectedId]?.x || 0, parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <p className="hint">Koristite strelice za fino podešavanje u pikselima</p>
                </div>
              </div>
            ) : (
              <div className="no-selection">Kliknite na polje da ga uredite</div>
            )}
          </div>

          <div className="side-section">
            <h3>Pozadina</h3>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
            <button className="btn-upload" onClick={() => fileInputRef.current?.click()}>
              Izaberi sliku formulara
            </button>
          </div>

          <div className="side-section">
            <h3>Zum</h3>
            <input 
              type="range" min="0.2" max="1.5" step="0.1" 
              value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} 
            />
          </div>

          <div className="side-section field-list">
            <h3>Sva polja (Strana {activePage})</h3>
            {activeFields.map(f => (
              <button 
                key={f.id} 
                className={`list-item ${selectedId === f.id ? 'active' : ''}`}
                onClick={() => setSelectedId(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="cal-workspace">
          <div className="cal-instructions">
            <MousePointer2 size={16} /> Prevucite polja ili koristite strelice za precizno pozicioniranje.
          </div>
          
          <div 
            ref={containerRef} 
            className="cal-a3-container"
            style={{ transform: `scale(${scale})` }}
            onMouseMove={handleMouseMove}
          >
            <div className="cal-mouse-coords">
              X: {mousePos.x}mm, Y: {mousePos.y}mm
            </div>
            <img 
              src={bgImage || `/obrazac_bg_page${activePage}.jpg`} 
              alt="Obrazac Background" 
              className="cal-bg-img"
              onError={(e) => {
                if (!bgImage) {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1122x1587?text=Ucitajte+sliku+formulara+dugmetom+levo';
                }
              }}
            />

            {activeFields.map(field => {
              const pos = settings[field.id] || { x: 0, y: 0 };
              const isSelected = selectedId === field.id;
              return (
                <motion.div
                  key={field.id}
                  onPan={(_, info) => handlePan(field.id, info)}
                  onPointerDown={() => setSelectedId(field.id)}
                  className={`cal-field ${isSelected ? 'selected' : ''}`}
                  style={{
                    left: `${pos.x}mm`,
                    top: `${pos.y}mm`,
                    position: 'absolute',
                    transform: 'translate(0, -50%)',
                    zIndex: isSelected ? 100 : 10
                  }}
                >
                  <div className="cal-field-content">
                    <span className="cal-field-label">{field.label}</span>
                    <div className="cal-field-value">
                      {field.id === 'hdr_jmbg' || field.id === 'hdr_job' || field.id === 'hdr_broj_combined' ? (
                        <div className="cal-box-row">
                          {(getMockValue(field.id, mockStudent) || "1234567890123").slice(0, 13).padEnd(13, ' ').split('').map((c: string, i: number) => (
                            <span key={i} className="cal-box-char">{c}</span>
                          ))}
                        </div>
                      ) : (
                        getMockValue(field.id, mockStudent)
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

