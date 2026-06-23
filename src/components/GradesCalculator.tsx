import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { 
  ArrowLeft, Download, Upload, Copy, CheckCircle2, AlertTriangle, 
  TrendingUp, Users, BookOpen, GraduationCap, Search, Trash2, Printer, 
  ChevronDown, ChevronUp, BarChart3, AlertCircle
} from 'lucide-react';
import './GradesCalculator.css';

// @ts-ignore
import GRADES_CALCULATOR_CODE from '../../ednevnik_grades_calculator.js?raw';

interface GradesCalculatorProps {
  onBack: () => void;
}

interface SubjectGrade {
  name: string;
  grades: number[];
  average: number | null;
  concluded: number | null;
}

interface StudentGradeData {
  rBr: string;
  name: string;
  vladanje: number | null;
  subjects: SubjectGrade[];
  gpa: number | null;
  successName: string;
  hasInsufficient: boolean;
  countConcluded: number;
}

interface ClassStats {
  total: number;
  graded: number;
  classGpa: number;
  odlican500?: number;
  odlican: number;
  vrloDobar: number;
  dobar: number;
  dovoljan: number;
  nedovoljan: number;
}

interface CalcPayload {
  skolskaGodina: string;
  odeljenje: string;
  datumProracuna: string;
  statistika: ClassStats;
  ucenici: StudentGradeData[];
}

export const GradesCalculator: React.FC<GradesCalculatorProps> = ({ onBack }) => {
  const [data, setData] = useState<CalcPayload | null>(() => {
    try {
      const saved = localStorage.getItem('ednevnik_grades_calc_data');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [pasteInput, setPasteInput] = useState('');
  const [importError, setImportError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSuccess, setFilterSuccess] = useState('all');
  const [expandedStudents, setExpandedStudents] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState(false);

  const bookmarklet = `javascript:${encodeURIComponent(GRADES_CALCULATOR_CODE)}`;
  const linkRef = useRef<HTMLAnchorElement>(null);

  useLayoutEffect(() => {
    if (linkRef.current) {
      linkRef.current.setAttribute('href', bookmarklet);
    }
  }, [bookmarklet]);

  useEffect(() => {
    if (data) {
      localStorage.setItem('ednevnik_grades_calc_data', JSON.stringify(data));
    } else {
      localStorage.removeItem('ednevnik_grades_calc_data');
    }
  }, [data]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GRADES_CALCULATOR_CODE);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleImportJson = (jsonString: string) => {
    try {
      setImportError('');
      const parsed = JSON.parse(jsonString);
      
      // Validacija strukture
      if (!parsed.ucenici || !Array.isArray(parsed.ucenici) || parsed.ucenici.length === 0) {
        throw new Error('Неисправан формат: Недостаје листа ученика.');
      }
      
      setData(parsed);
      setPasteInput('');
    } catch (err: any) {
      setImportError(err.message || 'Грешка при парсирању JSON података.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handleImportJson(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    if (window.confirm('Да ли сте сигурни да желите да уклоните увезене податке са овог уређаја?')) {
      setData(null);
      setExpandedStudents({});
    }
  };

  const toggleExpand = (studentName: string) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentName]: !prev[studentName]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  // Proračun proseka po predmetima za celo odeljenje
  const getSubjectStats = () => {
    if (!data) return [];
    
    const subjectMap: Record<string, { sum: number; count: number; grades: number[]; name: string }> = {};
    
    data.ucenici.forEach(s => {
      s.subjects.forEach(sub => {
        if (sub.average !== null) {
          if (!subjectMap[sub.name]) {
            subjectMap[sub.name] = { sum: 0, count: 0, grades: [], name: sub.name };
          }
          subjectMap[sub.name].sum += sub.average;
          subjectMap[sub.name].count++;
          subjectMap[sub.name].grades.push(...sub.grades);
        }
      });
    });
    
    return Object.values(subjectMap)
      .map(item => ({
        name: item.name,
        average: item.sum / item.count,
        totalGrades: item.grades.length
      }))
      .sort((a, b) => b.average - a.average);
  };

  const subjectStats = getSubjectStats();
  const highestSubject = subjectStats[0];
  const lowestSubject = subjectStats[subjectStats.length - 1];

  const filteredStudents = data?.ucenici.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterSuccess === 'all') return matchesSearch;
    if (filterSuccess === 'odlican500') return matchesSearch && s.successName === 'Odličan (5.00)';
    if (filterSuccess === 'odlican') return matchesSearch && s.successName === 'Odličan';
    if (filterSuccess === 'vrlodobar') return matchesSearch && s.successName === 'Vrlo dobar';
    if (filterSuccess === 'dobardovoljan') return matchesSearch && (s.successName === 'Dobar' || s.successName === 'Dovoljan');
    if (filterSuccess === 'nedovoljan') return matchesSearch && s.hasInsufficient;
    
    return matchesSearch;
  }) || [];

  return (
    <div className="grades-calc-container animate-fade-in">
      {/* Back button */}
      <div className="no-print" style={{ marginBottom: '1.5rem' }}>
        <button onClick={onBack} className="btn-back-link">
          <ArrowLeft size={16} />
          Назад на почетну
        </button>
      </div>

      {!data ? (
        /* SETUP MODE */
        <div className="setup-view glass p-8">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h1 className="text-gradient" style={{ fontSize: '2.2rem', fontWeight: 800 }}>Процена Успеха Ученика</h1>
            <p className="text-gray-500" style={{ marginTop: '0.5rem', maxWidth: '600px', marginInline: 'auto' }}>
              Преузмите и анализирајте оцене целог одељења са еДневника у реалном времену.
            </p>
          </div>

          <div className="setup-grid">
            {/* Steps & Bookmarklet */}
            <div className="setup-steps">
              <h2 className="setup-section-title">Како користити алат?</h2>
              
              <div className="setup-step-item">
                <div className="step-num">1</div>
                <div>
                  <h3>Инсталирајте Bookmarklet</h3>
                  <p>
                    Превуците плаво дугме испод у вашу траку са обележивачима (Bookmarks Bar) или копирајте код дугметом десно.
                  </p>
                  
                  <div className="bookmarklet-container">
                    <a ref={linkRef} className="draggable-bookmarklet" onClick={e => e.preventDefault()}>
                      📊 Процена Успеха
                    </a>
                    <button onClick={handleCopyCode} className="btn-copy-code" title="Копирај ЈС код">
                      {copiedLink ? <CheckCircle2 size={16} color="#48bb78" /> : <Copy size={16} />}
                      {copiedLink ? 'Копирано!' : 'Копирај код'}
                    </button>
                  </div>
                  <span className="step-tip">Савет: Притисните <strong>Ctrl + Shift + B</strong> да прикажете траку у прегледачу.</span>
                </div>
              </div>

              <div className="setup-step-item">
                <div className="step-num">2</div>
                <div>
                  <h3>Покрените на еДневнику</h3>
                  <p>
                    Пријавите се на еДневник, идите на одељењске извештаје, конкретно на страницу:
                    <br />
                    <code style={{ fontSize: '0.8rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
                      https://esdnevnik.rs/reports/school-class/students-grades
                    </code>
                    <br />
                    и кликните на обележивач <strong>"📊 Процена Успеха"</strong> у вашој траци.
                  </p>
                </div>
              </div>

              <div className="setup-step-item">
                <div className="step-num">3</div>
                <div>
                  <h3>Преузмите резултате</h3>
                  <p>
                    Након што скрпипта изврши прорачуне на еДневнику, отвориће се прозор са резултатима.
                    Кликните на <strong>"Копирај JSON за TSP Алат"</strong>.
                  </p>
                </div>
              </div>

              <div className="setup-step-item">
                <div className="step-num">4</div>
                <div>
                  <h3>Увезите овде</h3>
                  <p>Налепите копиране податке у поље десно или учитајте JSON да бисте генерисали комплетан извештај.</p>
                </div>
              </div>
            </div>

            {/* Paste & Import Form */}
            <div className="setup-import">
              <h2 className="setup-section-title">Увоз Података</h2>
              
              <div className="import-box">
                <textarea
                  placeholder="Налепите копирани JSON овде..."
                  value={pasteInput}
                  onChange={(e) => setPasteInput(e.target.value)}
                  className="import-textarea"
                />
                
                {importError && (
                  <div className="error-alert">
                    <AlertTriangle size={18} />
                    <span>{importError}</span>
                  </div>
                )}

                <div className="import-actions">
                  <button 
                    onClick={() => handleImportJson(pasteInput)}
                    disabled={!pasteInput.trim()}
                    className="nav-btn primary w-full"
                    style={{ justifyContent: 'center', padding: '0.75rem' }}
                  >
                    <Upload size={18} />
                    Учитај налепљени садржај
                  </button>

                  <div className="divider-or">или</div>

                  <label className="file-upload-label w-full">
                    <Download size={18} />
                    Изабери JSON Фајл
                    <input 
                      type="file" 
                      accept=".json" 
                      onChange={handleFileUpload} 
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* DASHBOARD MODE */
        <div className="dashboard-view">
          
          {/* Dashboard Header */}
          <div className="dashboard-header glass p-6 no-print">
            <div className="header-info">
              <span className="class-badge">{data.odeljenje}</span>
              <h1>Анализа успеха и оцена</h1>
              <p>Школска година: <strong>{data.skolskaGodina}</strong> | Извештај генерисан: {data.datumProracuna}</p>
            </div>
            
            <div className="header-buttons">
              <button onClick={handlePrint} className="nav-btn ghost">
                <Printer size={18} />
                Штампај Извештај
              </button>
              <button onClick={handleClear} className="nav-btn ghost hover-danger">
                <Trash2 size={18} />
                Уклони податке
              </button>
            </div>
          </div>

          {/* Printable Report Header */}
          <div className="print-only print-header">
            <div className="print-republika">РЕПУБЛИКА СРБИЈА</div>
            <div className="print-skola">Средња техничка школа</div>
            <h2 className="print-naslov">ИЗВЕШТАЈ О УСПЕХУ ОДЕЉЕЊА</h2>
            <div className="print-header-meta">
              <span>Одељење: <strong>{data.odeljenje}</strong></span>
              <span>Школска година: <strong>{data.skolskaGodina}</strong></span>
              <span>Датум извештаја: <strong>{data.datumProracuna}</strong></span>
            </div>
            <div className="print-stats-summary">
              <div className="print-summary-item">Укупно ученика: <strong>{data.statistika.total}</strong></div>
              <div className="print-summary-item">Оцењено: <strong>{data.statistika.graded}</strong></div>
              <div className="print-summary-item">Просечна оцена: <strong>{data.statistika.classGpa.toFixed(2)}</strong></div>
              <div className="print-summary-item">Скроз одлични (5.00): <strong>{data.statistika.odlican500 || 0}</strong></div>
              <div className="print-summary-item">Одлични (4.50-4.99): <strong>{data.statistika.odlican}</strong></div>
              <div className="print-summary-item">Недовољни: <strong>{data.statistika.nedovoljan}</strong></div>
            </div>
            <div className="print-header-divider"></div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid mt-6">
            <div className="stat-card glass flex-row">
              <div className="stat-icon-wrap primary"><Users size={24} /></div>
              <div>
                <span className="stat-card-label">Укупно (Оцењено)</span>
                <span className="stat-card-value">{data.statistika.total} ({data.statistika.graded})</span>
              </div>
            </div>

            <div className="stat-card glass flex-row">
              <div className="stat-icon-wrap success" style={{ background: 'rgba(212, 175, 55, 0.15)', color: '#d4af37' }}><GraduationCap size={24} /></div>
              <div>
                <span className="stat-card-label">Скроз одлични (5.00)</span>
                <span className="stat-card-value" style={{ color: '#d4af37' }}>{data.statistika.odlican500 || 0}</span>
              </div>
            </div>

            <div className="stat-card glass flex-row">
              <div className="stat-icon-wrap success"><GraduationCap size={24} /></div>
              <div>
                <span className="stat-card-label">Одлични (4.50-4.99)</span>
                <span className="stat-card-value">{data.statistika.odlican}</span>
              </div>
            </div>

            <div className="stat-card glass flex-row">
              <div className="stat-icon-wrap warning"><TrendingUp size={24} /></div>
              <div>
                <span className="stat-card-label">Средњи просек</span>
                <span className="stat-card-value text-gradient">{data.statistika.classGpa.toFixed(2)}</span>
              </div>
            </div>

            <div className="stat-card glass flex-row">
              <div className="stat-icon-wrap danger"><AlertCircle size={24} /></div>
              <div>
                <span className="stat-card-label">Недовољни</span>
                <span className="stat-card-value text-danger">{data.statistika.nedovoljan}</span>
              </div>
            </div>
          </div>

          {/* Detailed analysis cards */}
          <div className="analysis-panels-grid mt-6">
            
            {/* Grade distribution graph */}
            <div className="panel-card glass p-6">
              <h2 className="panel-title">
                <BarChart3 size={20} className="panel-icon" />
                Дистрибуција успеха
              </h2>
              
              <div className="distribution-bars">
                {/* Skroz odličan 5.00 */}
                <div className="bar-item">
                  <div className="bar-label">
                    <span>Скроз одличан (5.00)</span>
                    <strong>{data.statistika.odlican500 || 0} ({Math.round((data.statistika.odlican500 || 0) / data.statistika.graded * 100 || 0)}%)</strong>
                  </div>
                  <div className="bar-bg">
                    <div className="bar-fill" style={{ width: `${(data.statistika.odlican500 || 0) / data.statistika.graded * 100 || 0}%`, backgroundColor: '#d4af37' }}></div>
                  </div>
                </div>

                {/* Odličan */}
                <div className="bar-item">
                  <div className="bar-label">
                    <span>Одличан (4.50 - 4.99)</span>
                    <strong>{data.statistika.odlican} ({Math.round(data.statistika.odlican / data.statistika.graded * 100 || 0)}%)</strong>
                  </div>
                  <div className="bar-bg">
                    <div className="bar-fill fill-success" style={{ width: `${data.statistika.odlican / data.statistika.graded * 100 || 0}%` }}></div>
                  </div>
                </div>

                {/* Vrlo Dobar */}
                <div className="bar-item">
                  <div className="bar-label">
                    <span>Врло добар (3.50 - 4.49)</span>
                    <strong>{data.statistika.vrloDobar} ({Math.round(data.statistika.vrloDobar / data.statistika.graded * 100 || 0)}%)</strong>
                  </div>
                  <div className="bar-bg">
                    <div className="bar-fill fill-blue" style={{ width: `${data.statistika.vrloDobar / data.statistika.graded * 100 || 0}%` }}></div>
                  </div>
                </div>

                {/* Dobar */}
                <div className="bar-item">
                  <div className="bar-label">
                    <span>Добар (2.50 - 3.49)</span>
                    <strong>{data.statistika.dobar} ({Math.round(data.statistika.dobar / data.statistika.graded * 100 || 0)}%)</strong>
                  </div>
                  <div className="bar-bg">
                    <div className="bar-fill fill-warning" style={{ width: `${data.statistika.dobar / data.statistika.graded * 100 || 0}%` }}></div>
                  </div>
                </div>

                {/* Dovoljan */}
                <div className="bar-item">
                  <div className="bar-label">
                    <span>Довољан (2.00 - 2.49)</span>
                    <strong>{data.statistika.dovoljan} ({Math.round(data.statistika.dovoljan / data.statistika.graded * 100 || 0)}%)</strong>
                  </div>
                  <div className="bar-bg">
                    <div className="bar-fill fill-purple" style={{ width: `${data.statistika.dovoljan / data.statistika.graded * 100 || 0}%` }}></div>
                  </div>
                </div>

                {/* Nedovoljan */}
                <div className="bar-item">
                  <div className="bar-label flex items-center justify-between">
                    <span>Недовољан (са 1)</span>
                    <strong>{data.statistika.nedovoljan} ({Math.round(data.statistika.nedovoljan / data.statistika.graded * 100 || 0)}%)</strong>
                  </div>
                  <div className="bar-bg">
                    <div className="bar-fill fill-danger" style={{ width: `${data.statistika.nedovoljan / data.statistika.graded * 100 || 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart insights */}
            <div className="panel-card glass p-6">
              <h2 className="panel-title">
                <BookOpen size={20} className="panel-icon" />
                Увид и Статистика предмета
              </h2>

              <div className="insights-content">
                {highestSubject && (
                  <div className="insight-row">
                    <div className="insight-dot dot-success"></div>
                    <div>
                      <span>Најбољи успех: </span>
                      <strong>{highestSubject.name}</strong> са просеком <strong>{highestSubject.average.toFixed(2)}</strong> ({highestSubject.totalGrades} оцена)
                    </div>
                  </div>
                )}

                {lowestSubject && (
                  <div className="insight-row">
                    <div className="insight-dot dot-danger"></div>
                    <div>
                      <span>Најслабији успех: </span>
                      <strong>{lowestSubject.name}</strong> са просеком <strong>{lowestSubject.average.toFixed(2)}</strong> ({lowestSubject.totalGrades} оцена)
                    </div>
                  </div>
                )}

                <div className="insight-row">
                  <div className="insight-dot dot-info"></div>
                  <div>
                    <span>Пролазност одељења: </span>
                    <strong>{Math.round((data.statistika.graded - data.statistika.nedovoljan) / data.statistika.graded * 100 || 0)}%</strong> 
                    ({data.statistika.graded - data.statistika.nedovoljan} од {data.statistika.graded} оцењених ученика нема недовољне оцене)
                  </div>
                </div>

                {data.statistika.nedovoljan > 0 && (
                  <div className="insight-row warning-light">
                    <AlertTriangle size={18} className="text-accent" />
                    <div>
                      <span>Пажња: </span>
                      <strong>{data.statistika.nedovoljan}</strong> ученика има једну или више закључених недовољних оцена (1) након обраде просека.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search, Filter & List Container */}
          <div className="students-panel glass mt-6 no-print">
            <div className="panel-header-search">
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>Именик и успех ученика</h2>
              
              <div className="search-filter-controls">
                <div className="search-input-wrap">
                  <Search size={18} className="search-icon-svg" />
                  <input
                    type="text"
                    placeholder="Претражи ученике..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <select 
                  value={filterSuccess} 
                  onChange={(e) => setFilterSuccess(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Сви уноси</option>
                  <option value="odlican500">Скроз одлични (5.00)</option>
                  <option value="odlican">Одлични (4.50-4.99)</option>
                  <option value="vrlodobar">Врло добра</option>
                  <option value="dobardovoljan">Добри и довољни</option>
                  <option value="nedovoljan">Недовољни</option>
                </select>
              </div>
            </div>

            {/* Students List Table */}
            <div className="students-grades-list">
              {filteredStudents.length === 0 ? (
                <div className="empty-state">Нема ученика који одговарају задатим критеријумима.</div>
              ) : (
                filteredStudents.map(student => {
                  const isExpanded = !!expandedStudents[student.name];
                  
                  // Uspeh badge class
                  let statusClass = 'success';
                  if (student.successName === 'Odličan (5.00)') statusClass = 'gold-star';
                  else if (student.successName === 'Vrlo dobar') statusClass = 'info';
                  else if (student.successName === 'Dobar' || student.successName === 'Dovoljan') statusClass = 'warning';
                  else if (student.successName === 'Nedovoljan') statusClass = 'danger';

                  // Broj jedinica
                  const oneGradesCount = student.subjects.filter(s => s.concluded === 1).length;

                  return (
                    <div key={student.name} className={`student-grade-row ${student.successName === 'Odličan (5.00)' ? 'border-gold' : student.hasInsufficient ? 'border-danger' : ''}`}>
                      
                      {/* Row Header */}
                      <div 
                        className="student-grade-row-header"
                        onClick={() => toggleExpand(student.name)}
                      >
                        <div className="std-info">
                          <span className="std-rbr">{student.rBr}</span>
                          <span className="std-name">{student.name}</span>
                          {student.vladanje !== null && (
                            <span className="std-vladanje" title="Владање">Владање: <strong>{student.vladanje}</strong></span>
                          )}
                        </div>
                        
                        <div className="std-results">
                          {oneGradesCount > 0 && (
                            <span className="badge-danger-glow">
                              <AlertCircle size={14} />
                              {oneGradesCount} недовољна
                            </span>
                          )}
                          <span className={`status-badge-square ${statusClass}`}>
                            {student.successName}
                          </span>
                          <span className="gpa-badge">
                            {student.gpa !== null ? student.gpa.toFixed(2) : '/'}
                          </span>
                          <button className="btn-expand-details">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="student-grade-row-details">
                          <div className="details-header">Предмети са оценама:</div>
                          <div className="subjects-details-grid">
                            {student.subjects.map(sub => {
                              if (sub.grades.length === 0) return null;
                              const hasOne = sub.concluded === 1;
                              
                              return (
                                <div key={sub.name} className={`subject-detail-item ${hasOne ? 'insufficient' : ''}`}>
                                  <div className="sub-name">{sub.name}</div>
                                  <div className="sub-grades">
                                    Оцене: <span>[{sub.grades.join(', ')}]</span>
                                  </div>
                                  <div className="sub-averages">
                                    <span>Просек: <strong>{sub.average?.toFixed(2)}</strong></span>
                                    {sub.concluded !== null && (
                                      <span>Закључено: <strong className={hasOne ? 'text-danger' : 'text-primary-light'}>{sub.concluded}</strong></span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Printable Student Success List */}
          <div className="print-only print-table-container">
            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: '45px', textAlign: 'center' }}>Р.б.</th>
                  <th>Презиме и име ученика</th>
                  <th style={{ width: '85px', textAlign: 'center' }}>Владање</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Недовољне оцене</th>
                  <th style={{ width: '85px', textAlign: 'right' }}>Просек</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Општи успех</th>
                </tr>
              </thead>
              <tbody>
                {data.ucenici.map(s => {
                  const oneCount = s.subjects.filter(sub => sub.concluded === 1).length;
                  const is500 = s.gpa === 5.00;
                  return (
                    <tr key={s.name} className={is500 ? 'print-row-gold' : s.hasInsufficient ? 'print-row-danger' : ''}>
                      <td style={{ textAlign: 'center' }}>{s.rBr}</td>
                      <td style={{ fontWeight: is500 ? 'bold' : 'normal' }}>{s.name}</td>
                      <td style={{ textAlign: 'center' }}>{s.vladanje !== null ? s.vladanje : '/'}</td>
                      <td style={{ textAlign: 'center', fontWeight: oneCount > 0 ? 'bold' : 'normal' }}>
                        {oneCount > 0 ? `${oneCount} предмет(а)` : 'Нема'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {s.gpa !== null ? s.gpa.toFixed(2) : '/'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{s.successName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Subject stats in print */}
            <h3 style={{ marginTop: '2.5rem', marginBottom: '1rem', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Просек оцена по предметима</h3>
            <table className="print-table print-table-sub" style={{ maxWidth: '600px' }}>
              <thead>
                <tr>
                  <th>Предмет</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Просек</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Оцена</th>
                </tr>
              </thead>
              <tbody>
                {subjectStats.map(item => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td style={{ textAlign: 'right' }}>{item.average.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{item.totalGrades}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  );
};
