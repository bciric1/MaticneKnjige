import React, { useRef, useState } from 'react';
import type { Student, PrintCalibrationSettings } from '../types';
import { useReactToPrint } from 'react-to-print';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import './RegistryView.css';

interface Props { student: Student; onBack: () => void; onNext?: () => void; onPrev?: () => void; }

const STORAGE_KEY = 'maticna_print_calibration';

const DEFAULT_CALIB: PrintCalibrationSettings = {
  'hdr_broj_combined': { x: 40, y: 28 },
  'hdr_reg': { x: 130, y: 28 },
  'hdr_jmbg': { x: 235, y: 22 },
  'hdr_job': { x: 235, y: 36 },
  'pers_name': { x: 120, y: 62 },
  'pers_dob': { x: 60, y: 78 },
  'pers_place': { x: 155, y: 78 },
  'pers_parents': { x: 145, y: 94 },
  'enr_school': { x: 125, y: 110 },
  'enr_class': { x: 235, y: 110 },
  'enr_profile': { x: 110, y: 126 },
  'enr_smer': { x: 110, y: 132 },
  'enr_jisp': { x: 110, y: 138 },
  'enr_duration': { x: 250, y: 126 },
  'status_redovan': { x: 100, y: 140 },
  'skolska_godina_1': { x: 150, y: 140 },
  'skolska_godina_2': { x: 180, y: 140 },
  'enr_class_roman': { x: 100, y: 130 },
  'pers_country': { x: 255, y: 78 },
  // Strana 2 defaulti
  'back_class_roman': { x: 140, y: 80 },
  'back_skolska_godina_1': { x: 140, y: 85 },
  'back_skolska_godina_2': { x: 140, y: 90 },
  'back_vladanje': { x: 140, y: 100 },
  'back_uspeh': { x: 140, y: 110 },
  'back_prosek': { x: 140, y: 120 },
  'adm_ispisnica_br': { x: 140, y: 140 },
  'adm_ispit_br': { x: 140, y: 160 },
  'adm_sved_br': { x: 140, y: 180 },
  'adm_sved_ser': { x: 140, y: 200 },
  'adm_staresina': { x: 140, y: 220 },
  'extra_awards': { x: 50, y: 240 },
  'mat_exam_info': { x: 120, y: 280 },
  'mat_subjects': { x: 200, y: 310 },
  'mat_rad_naziv': { x: 150, y: 350 },
  'mat_rad_ocene': { x: 220, y: 370 },
  'mat_final_grade': { x: 220, y: 400 },
  'mat_diploma_br': { x: 80, y: 420 },
  'mat_diploma_ser': { x: 80, y: 440 },
  'back_napomena': { x: 50, y: 460 },
};

function getRazred(student: Student, yr: number) {
  if (!student.razredi) return null;
  const r = (student.razredi as any)[yr] || (student.razredi as any)[String(yr)];
  if (r) return r;
  if (Array.isArray(student.razredi)) return student.razredi[yr - 1];
  return null;
}

function getGrade(student: Student, yr: number, subj: string) {
  const r = getRazred(student, yr);
  if (!r || !r.predmeti) return '';
  return r.predmeti.find((p: any) => String(p.naziv || '').replace(/\s+/g, ' ').trim() === subj)?.ocena ?? '';
}

const getAllSubjects = (student: Student) => {
  const subjectMap = new Map<string, number>();
  [1, 2, 3, 4].forEach(y => {
    const razred = getRazred(student, y);
    razred?.predmeti?.forEach((p: any) => {
      const name = String(p.naziv).replace(/\s+/g, ' ').trim();
      if (name && !subjectMap.has(name)) subjectMap.set(name, y);
    });
  });
  return Array.from(subjectMap.keys());
};

function cleanStr(s: any): string {
  if (s === undefined || s === null) return '';
  return String(s).replace(/\s+/g, ' ').trim();
}

const CalibField = ({ id, val, className = "", calib }: { id: string, val: any, className?: string, calib: any }) => {
  const pos = calib[id];
  if (!pos) return null;
  const isMonospace = className.includes('monospace');
  return (
    <div className={`calib-field-print ${className}`} style={{ left: `${pos.x}mm`, top: `${pos.y}mm`, position: 'absolute', transform: 'translate(0, -50%)' }}>
      {isMonospace ? (
        <div className="box-row-print">
          {String(val).split('').map((char, i) => (
            <span key={i} className="box-char-print">{char}</span>
          ))}
        </div>
      ) : val}
    </div>
  );
};

export const RegistryView: React.FC<Props> = ({ student, onBack, onNext, onPrev }) => {
  const ref = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: ref });
  const [currentPage, setCurrentPage] = useState(1);
  const [useOverlay, setUseOverlay] = useState(() => localStorage.getItem('maticna_use_overlay') === 'true');
  const [calib] = useState<any>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_CALIB, ...parsed };
      } catch (e) {
        return DEFAULT_CALIB;
      }
    }
    return DEFAULT_CALIB;
  });

  const [hiddenFields, setHiddenFields] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('maticna_hidden_fields');
      if (saved) return new Set(JSON.parse(saved));
    } catch(e) {}
    return new Set(['enr_school', 'enr_smer', 'enr_jisp']);
  });
  
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('maticna_hidden_items');
      if (saved) return new Set(JSON.parse(saved));
    } catch(e) {}
    return new Set();
  });

  const toggleField = (id: string) => {
    setHiddenFields(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem('maticna_hidden_fields', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const toggleItem = (key: string) => {
    setHiddenItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      localStorage.setItem('maticna_hidden_items', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const [previewScale, setPreviewScale] = useState(0.5);

  const ALL_FIELDS = [
    { id: 'hdr_broj_combined', label: 'Број (збирно)', page: 1 },
    { id: 'hdr_reg', label: 'Број у регистру', page: 1 },
    { id: 'hdr_jmbg', label: 'ЈМБГ', page: 1 },
    { id: 'hdr_job', label: 'ЈОБ', page: 1 },
    { id: 'pers_name', label: 'Име и презиме', page: 1 },
    { id: 'pers_dob', label: 'Датум рођења', page: 1 },
    { id: 'pers_place', label: 'Место и општина', page: 1 },
    { id: 'pers_country', label: 'Држава', page: 1 },
    { id: 'pers_parents', label: 'Родитељи', page: 1 },
    { id: 'enr_school', label: 'Школа', page: 1 },
    { id: 'enr_class', label: 'Разред', page: 1 },
    { id: 'enr_class_roman', label: 'Разред (римски)', page: 1 },
    { id: 'enr_profile', label: 'Профил', page: 1 },
    { id: 'enr_smer', label: 'Смер', page: 1 },
    { id: 'enr_jisp', label: 'ЈИСП програм', page: 1 },
    { id: 'enr_duration', label: 'Трајање', page: 1 },
    { id: 'status_redovan', label: 'Статус', page: 1 },
    { id: 'skolska_godina_1', label: 'Школска година 1', page: 1 },
    { id: 'skolska_godina_2', label: 'Школска година 2', page: 1 },
    { id: 'grades_subjects', label: 'Списак предмета', page: 1 },
    { id: 'grades_y1', label: 'Оцене I год', page: 1 },
    { id: 'grades_y2', label: 'Оцене II год', page: 1 },
    { id: 'grades_y3', label: 'Оцене III год', page: 1 },
    { id: 'grades_y4', label: 'Оцене IV год', page: 1 },
    { id: 'back_class_roman', label: 'Разред римски (I год)', page: 2 },
    { id: 'back_skolska_godina_1', label: 'Школска година 1 (I год)', page: 2 },
    { id: 'back_skolska_godina_2', label: 'Школска година 2 (I год)', page: 2 },
    { id: 'back_vladanje', label: 'Владање', page: 2 },
    { id: 'back_uspeh', label: 'Општи успех', page: 2 },
    { id: 'back_prosek', label: 'Просек', page: 2 },
    { id: 'adm_ispisnica_br', label: 'Исписница', page: 2 },
    { id: 'adm_ispit_br', label: 'Уверење испита', page: 2 },
    { id: 'adm_sved_br', label: 'Сведочанство', page: 2 },
    { id: 'adm_sved_ser', label: 'Серијски бр. свед.', page: 2 },
    { id: 'adm_staresina', label: 'Потпис старешине', page: 2 },
    { id: 'extra_awards', label: 'Похвале и награде', page: 2 },
    { id: 'mat_exam_info', label: 'Матура - инfo', page: 2 },
    { id: 'mat_subjects', label: 'Матура - оцене', page: 2 },
    { id: 'mat_rad_naziv', label: 'Матурски рад', page: 2 },
    { id: 'mat_rad_ocene', label: 'Оцене рада', page: 2 },
    { id: 'mat_final_grade', label: 'Матура - успех', page: 2 },
    { id: 'mat_diploma_br', label: 'Број дипломе', page: 2 },
    { id: 'mat_diploma_ser', label: 'Серијски бр. дипл.', page: 2 },
    { id: 'back_napomena', label: 'Напомена', page: 2 },
  ];

  const subjects = getAllSubjects(student);
  const years = [1, 2, 3, 4];

  return (
    <div className="registry-view-root">
      <div className="rv-toolbar no-print">
        <div className="rv-t-left">
          <button className="btn-icon" onClick={onBack} title="Назад"><ArrowLeft size={20}/></button>
          <h1>{student.prezime} {student.ime} (Страна {currentPage})</h1>
          <div style={{ display: 'flex', gap: '5px', marginLeft: '20px' }}>
            <button className="btn-icon" onClick={onPrev} disabled={!onPrev} title="Претходни ученик"><ChevronLeft size={20}/></button>
            <button className="btn-icon" onClick={onNext} disabled={!onNext} title="Следећи ученик"><ChevronRight size={20}/></button>
          </div>
        </div>
        <div className="rv-t-actions">
          <span className="zoom-info no-print">{Math.round(previewScale * 100)}%</span>
          <button className="btn-small" onClick={() => setCurrentPage(currentPage === 1 ? 2 : 1)}>Страна {currentPage === 1 ? 2 : 1}</button>
          <button className={`btn-small ${useOverlay ? 'active' : ''}`} onClick={() => { setUseOverlay(!useOverlay); localStorage.setItem('maticna_use_overlay', (!useOverlay).toString()); }}>{useOverlay ? 'Само подаци' : 'Цела страна'}</button>
          <button className="btn-small" onClick={() => handlePrint()} style={{ background: '#2563eb', color: 'white' }}>Штампај</button>
        </div>
      </div>

      <div className="rv-main-layout">
        <div className="rv-sidebar no-print">
          <div className="side-section">
            <h3>Зум прегледа</h3>
            <input 
              type="range" 
              min="0.2" 
              max="1.5" 
              step="0.05" 
              value={previewScale} 
              onChange={(e) => setPreviewScale(parseFloat(e.target.value))} 
              className="zoom-slider"
            />
          </div>
          <hr/>
          <h3>Видљивост поља</h3>
          <div className="field-toggle-list">
             <button className="btn-small" onClick={() => setHiddenFields(new Set())}>Укључи све</button>
             <button className="btn-small" onClick={() => setHiddenFields(new Set(ALL_FIELDS.map(f => f.id)))}>Искључи све</button>
             <hr/>
            {ALL_FIELDS.filter(f => f.page === currentPage).map(f => (
              <label key={f.id} className="toggle-item">
                <input type="checkbox" checked={!hiddenFields.has(f.id)} onChange={() => toggleField(f.id)} />
                <span>{f.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div ref={ref} className={`rv-print-area ${useOverlay ? 'overlay-mode' : ''}`}>
           {useOverlay ? (
             <div 
               className="a3-page overlay-canvas"
               style={{ 
                 transform: `scale(${previewScale})`, 
                 transformOrigin: 'center top' 
               }}
             >
                <img 
                  src={`/obrazac_bg_page${currentPage}.jpg`} 
                  className="overlay-bg-ref no-print" 
                  alt="" 
                  onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} 
                />
                {currentPage === 1 ? (
                  <>
                    {!hiddenFields.has('hdr_broj_combined') && <CalibField calib={calib} id="hdr_broj_combined" val={(student.brObrasca || '').split('/').join('')} className="monospace" />}
                    {!hiddenFields.has('hdr_reg') && <CalibField calib={calib} id="hdr_reg" val={student.brojURegistru} />}
                    {!hiddenFields.has('hdr_jmbg') && <CalibField calib={calib} id="hdr_jmbg" val={student.jmbg} className="monospace" />}
                    {!hiddenFields.has('hdr_job') && <CalibField calib={calib} id="hdr_job" val={student.job} className="monospace" />}
                    {!hiddenFields.has('pers_name') && <CalibField calib={calib} id="pers_name" val={cleanStr(`${student.prezime} ${student.ime}`)} className="bold big" />}
                    {!hiddenFields.has('pers_dob') && <CalibField calib={calib} id="pers_dob" val={student.datumRodjenja ? new Date(student.datumRodjenja).toLocaleDateString('sr-RS') : ''} />}
                    {!hiddenFields.has('pers_place') && <CalibField calib={calib} id="pers_place" val={cleanStr(`${student.mestoRodjenja || ''}, ${student.opstinaRodjenja || ''}`)} />}
                    {!hiddenFields.has('pers_country') && <CalibField calib={calib} id="pers_country" val={cleanStr(student.drzavaRodjenja || 'Srbija')} />}
                    {!hiddenFields.has('pers_parents') && <CalibField calib={calib} id="pers_parents" val={cleanStr(student.imeRoditeljaStaratelja)} />}
                    {!hiddenFields.has('enr_school') && <CalibField calib={calib} id="enr_school" val={cleanStr(student.skolaUpisa)} />}
                    {!hiddenFields.has('enr_class') && <CalibField calib={calib} id="enr_class" val={cleanStr(student.razredUpisa)} />}
                    {!hiddenFields.has('enr_profile') && <CalibField calib={calib} id="enr_profile" val={cleanStr(student.obrazovniProfilSmer)} />}
                    {!hiddenFields.has('enr_smer') && <CalibField calib={calib} id="enr_smer" val={cleanStr(student.smer)} />}
                    {!hiddenFields.has('enr_jisp') && <CalibField calib={calib} id="enr_jisp" val={cleanStr(student.jispProgram)} />}
                    {!hiddenFields.has('enr_duration') && <CalibField calib={calib} id="enr_duration" val={student.trajanjeObrazovanjaGodina} />}
                    {!hiddenFields.has('status_redovan') && <CalibField calib={calib} id="status_redovan" val={(student.jmbg && student.jmbg.length === 13 && parseInt(student.jmbg.charAt(9)) >= 5) ? 'редовна' : 'редован'} />}
                    {years.map(y => {
                      const r = getRazred(student, y);
                      return (
                        <React.Fragment key={`hdr_y${y}`}>
                          {!hiddenFields.has(`hdr_y${y}_razred`) && <CalibField calib={calib} id={`hdr_y${y}_razred`} val={r?.razred || ''} />}
                          {!hiddenFields.has(`hdr_y${y}_god1`) && <CalibField calib={calib} id={`hdr_y${y}_god1`} val={(r?.skolskaGodina || '').split(/[\/\-]/)[0]} />}
                          {!hiddenFields.has(`hdr_y${y}_god2`) && <CalibField calib={calib} id={`hdr_y${y}_god2`} val={(r?.skolskaGodina || '').split(/[\/\-]/)[1] || ''} />}
                        </React.Fragment>
                      );
                    })}

                    {!hiddenFields.has('grades_subjects') && (
                      <div className="calib-field-print no-border" style={{ left: `${calib['grades_subjects']?.x ?? 20}mm`, top: `${calib['grades_subjects']?.y ?? 150}mm`, position: 'absolute', pointerEvents: 'auto' }}>
                        <table className="no-border">
                          <tbody>
                            {subjects.map((subj, i) => {
                              const isHidden = hiddenItems.has(`subj_${i}`);
                              return (
                                <tr key={i} style={{ height: `${calib.gradesRowHeight || 6.5}mm` }}>
                                  <td 
                                    className={`td-subj ${isHidden ? 'hide-on-print' : ''}`} 
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => toggleItem(`subj_${i}`)}
                                    title="Kliknite da sakrijete/prikažete ovaj predmet"
                                  >
                                    {subj}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {years.map(y => !hiddenFields.has(`grades_y${y}`) && (
                      <div key={y} className="cal-field" style={{ left: `${calib[`grades_y${y}`]?.x ?? (140 + (y-1)*25)}mm`, top: `${calib[`grades_y${y}`]?.y ?? 150}mm`, position: 'absolute' }}>
                        <table className="no-border" style={{ width: `${calib.gradesColWidth || 15}mm` }}>
                          <tbody>
                            {subjects.map((subj, i) => {
                              const rawGrade = getGrade(student, y, subj);
                              let formattedGrade = rawGrade;
                              if (rawGrade === '5') formattedGrade = 'одличан (5)';
                              else if (rawGrade === '4') formattedGrade = 'врло добар (4)';
                              else if (rawGrade === '3') formattedGrade = 'добар (3)';
                              else if (rawGrade === '2') formattedGrade = 'довољан (2)';
                              else if (rawGrade === '1') formattedGrade = 'недовољан (1)';

                              const isHidden = hiddenItems.has(`grade_${y}_${i}`);
                              return (
                                <tr key={i} style={{ height: `${calib.gradesRowHeight || 6.5}mm` }}>
                                  <td 
                                    className={`td-gr ${isHidden ? 'hide-on-print' : ''}`} 
                                    style={{ textAlign: 'center', whiteSpace: 'nowrap', cursor: 'pointer' }}
                                    onClick={() => toggleItem(`grade_${y}_${i}`)}
                                    title="Kliknite da sakrijete/prikažete ovu ocenu"
                                  >
                                    {formattedGrade}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {years.map(y => {
                      const r = getRazred(student, y);
                      
                      const getStyle = (id: string, defaultX: number, defaultY: number): React.CSSProperties => ({
                        left: `${(calib[id]?.x ?? defaultX) + (y - 1) * 25}mm`,
                        top: `${calib[id]?.y ?? defaultY}mm`,
                        position: 'absolute',
                        transform: 'translate(0, -50%)',
                        whiteSpace: 'nowrap'
                      });

                      return (
                        <React.Fragment key={y}>
                          {!hiddenFields.has('back_class_roman') && (
                            <div className="calib-field-print" style={getStyle('back_class_roman', 140, 80)}>
                              {r?.razred}
                            </div>
                          )}
                          {!hiddenFields.has('back_skolska_godina_1') && (
                            <div className="calib-field-print" style={getStyle('back_skolska_godina_1', 140, 85)}>
                              {(r?.skolskaGodina || '').split(/[\/\-]/)[0]}
                            </div>
                          )}
                          {!hiddenFields.has('back_skolska_godina_2') && (
                            <div className="calib-field-print" style={getStyle('back_skolska_godina_2', 140, 90)}>
                              {(r?.skolskaGodina || '').split(/[\/\-]/)[1] || ''}
                            </div>
                          )}
                          {!hiddenFields.has('back_vladanje') && (
                            <div className="calib-field-print" style={getStyle('back_vladanje', 140, 100)}>
                              {r?.vladanje}
                            </div>
                          )}
                          {!hiddenFields.has('back_uspeh') && (
                            <div className="calib-field-print" style={getStyle('back_uspeh', 140, 110)}>
                              {r?.opstiUspeh}
                            </div>
                          )}
                          {!hiddenFields.has('back_prosek') && (
                            <div className="calib-field-print" style={getStyle('back_prosek', 140, 120)}>
                              {r?.prosecnaOcena}
                            </div>
                          )}
                          {!hiddenFields.has('adm_ispisnica_br') && (
                            <div className="calib-field-print" style={getStyle('adm_ispisnica_br', 140, 140)}>
                              {r?.delovodniBrojIspisnice}
                            </div>
                          )}
                          {!hiddenFields.has('adm_ispit_br') && (
                            <div className="calib-field-print" style={getStyle('adm_ispit_br', 140, 160)}>
                              {r?.delovodniBrojUverenjaPIspit}
                            </div>
                          )}
                          {!hiddenFields.has('adm_sved_br') && (
                            <div className="calib-field-print" style={getStyle('adm_sved_br', 140, 180)}>
                              {r?.delovodniBrojSvedocanstva}
                            </div>
                          )}
                          {!hiddenFields.has('adm_sved_ser') && (
                            <div className="calib-field-print" style={getStyle('adm_sved_ser', 140, 200)}>
                              {r?.serijskiBrojSvedocanstva}
                            </div>
                          )}
                          {!hiddenFields.has('adm_staresina') && (
                            <div className="calib-field-print" style={getStyle('adm_staresina', 140, 220)}>
                              {r?.potpisOdeljenskogStaresine ? 'DA' : ''}
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {!hiddenFields.has('mat_exam_info') && (
                      <CalibField calib={calib} id="mat_exam_info" val={`${student.matura?.rokPolaganja || ''} ${student.matura?.skolskaGodina || ''}`} />
                    )}
                    {!hiddenFields.has('mat_subjects') && (
                      <div className="calib-field-print" style={{ left: `${calib['mat_subjects']?.x ?? 200}mm`, top: `${calib['mat_subjects']?.y ?? 310}mm`, position: 'absolute', transform: 'translate(0, -50%)' }}>
                        {student.matura?.predmetiZnanje?.map((p, i) => (
                          <div key={i}>{p.naziv} {p.ocena}</div>
                        ))}
                      </div>
                    )}
                    {!hiddenFields.has('mat_rad_naziv') && (
                      <CalibField calib={calib} id="mat_rad_naziv" val={student.matura?.maturskiRad?.nazivRada || ''} />
                    )}
                    {!hiddenFields.has('mat_rad_ocene') && (
                      <div className="calib-field-print" style={{ left: `${calib['mat_rad_ocene']?.x ?? 220}mm`, top: `${calib['mat_rad_ocene']?.y ?? 370}mm`, position: 'absolute', transform: 'translate(0, -50%)' }}>
                        <div>{student.matura?.maturskiRad?.ocenaIzrade}</div>
                        <div>{student.matura?.maturskiRad?.ocenaOdbrane}</div>
                        <div>{student.matura?.maturskiRad?.ocenaRada}</div>
                      </div>
                    )}
                    {!hiddenFields.has('mat_final_grade') && (
                      <CalibField calib={calib} id="mat_final_grade" val={student.matura?.uspeh || ''} />
                    )}
                    {!hiddenFields.has('mat_diploma_br') && (
                      <CalibField calib={calib} id="mat_diploma_br" val={student.matura?.delovodniBrojDiplome || ''} />
                    )}
                    {!hiddenFields.has('mat_diploma_ser') && (
                      <CalibField calib={calib} id="mat_diploma_ser" val={student.matura?.serijskiBrojDiplome || ''} />
                    )}
                    {!hiddenFields.has('extra_awards') && (
                      <CalibField calib={calib} id="extra_awards" val={student.pohvaleINagrade || ''} />
                    )}
                    {!hiddenFields.has('back_napomena') && (
                      <CalibField calib={calib} id="back_napomena" val={student.napomene || ''} />
                    )}
                  </>
                )}
             </div>
           ) : (
             <div 
               className="a3-page" 
               style={{ 
                 padding: '20mm',
                 transform: `scale(${previewScale})`, 
                 transformOrigin: 'center top' 
               }}
             >
                <h2 style={{ textAlign: 'center' }}>Матична књига - Цео лист</h2>
                <p><b>Ученик:</b> {student.prezime} {student.ime}</p>
                <table className="grades-tbl" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                   <thead>
                      <tr>
                        <th style={{ border: '1px solid black', padding: '5px' }}>Предмет</th>
                        {years.map(y => <th key={y} style={{ border: '1px solid black', padding: '5px' }}>{y}. раз</th>)}
                      </tr>
                   </thead>
                   <tbody>
                      {subjects.map((subj, i) => (
                        <tr key={i}>
                          <td style={{ border: '1px solid black', padding: '5px' }}>{subj}</td>
                          {years.map(y => <td key={y} style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>{getGrade(student, y, subj)}</td>)}
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
