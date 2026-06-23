import React, { useState } from 'react';
import type { Student, RazredniPodaci, PredmetOcena } from '../types';
import { Save, X, User, GraduationCap, FileText, ChevronDown, ChevronUp, PlusCircle, Trash2 } from 'lucide-react';

interface StudentFormProps {
  student?: Student | null;
  onSubmit: (student: Student) => void;
  onCancel: () => void;
}

const emptyRazred = (razred: string, skolskaGodina: string): RazredniPodaci => ({
  skolskaGodina,
  razred,
  predmeti: [],
  vladanje: '',
  opstiUspeh: '',
  prosecnaOcena: '',
  delovodniBrojIspisnice: '',
  datumIspisnice: '',
  primilaIspisnicu: '',
  delovodniBrojUverenjaPIspit: '',
  datumUverenjaPIspit: '',
  primilaUverenjePIspit: '',
  delovodniBrojSvedocanstva: '',
  datumSvedocanstva: '',
  primiliSvedocanstvo: '',
  serijskiBrojSvedocanstva: '',
  potpisOdeljenskogStaresine: '',
});

const emptyStudent = (): Student => ({
  id: Math.random().toString(36).substr(2, 9),
  brObrasca: '',
  brojURegistru: '',
  jmbg: '',
  job: '',
  prezime: '',
  ime: '',
  mestoRodjenja: '',
  datumRodjenja: '',
  opstinaRodjenja: '',
  drzavaRodjenja: 'Srbija',
  imeRoditeljaOca: 'otac',
  imeRoditeljaStaratelja: '',
  skolaUpisa: '',
  razredUpisa: 'I',
  obrazovniProfilSmer: '',
  jispProgram: '',
  trajanjeObrazovanjaGodina: 4,
  razredi: {
    1: emptyRazred('I', ''),
  },
  pohvaleINagrade: '',
  matura: {
    tipIspita: 'maturski',
    rokPolaganja: '',
    skolskaGodina: '',
    godinaPolaganja: '',
    predmetiZnanje: [{ naziv: '', ocena: '' }, { naziv: '', ocena: '' }],
    datumOdbraneRada: '',
    maturskiRad: { nazivRada: '', ocenaIzrade: '', ocenaOdbrane: '', ocenaRada: '' },
    ukupnaOcena: '',
    uspeh: '',
    delovodniBrojDiplome: '',
    datumDiplome: '',
    delovodniBrojUverenja: '',
    datumUverenja: '',
    serijskiBrojDiplome: '',
    primilaDispIUverenje: '',
  },
  napomene: '',
});

export const StudentForm: React.FC<StudentFormProps> = ({ student, onSubmit, onCancel }) => {
  const getInitialForm = (): Student => {
    if (!student) return emptyStudent();
    const def = emptyStudent();
    return {
      ...def,
      ...student,
      matura: {
        ...def.matura,
        ...(student.matura || {}),
        maturskiRad: {
          ...def.matura.maturskiRad,
          ...(student.matura?.maturskiRad || {})
        },
        predmetiZnanje: student.matura?.predmetiZnanje || def.matura.predmetiZnanje
      },
      razredi: (() => {
        const merged: Record<number, RazredniPodaci> = {};
        if (student.razredi && Object.keys(student.razredi).length > 0) {
          Object.entries(student.razredi).forEach(([key, val]) => {
            const k = parseInt(key);
            merged[k] = {
              ...emptyRazred(val.razred || '', val.skolskaGodina || ''),
              ...val,
              predmeti: val.predmeti || []
            };
          });
        } else {
          merged[1] = emptyRazred('I', '');
        }
        return merged;
      })()
    };
  };

  const [form, setForm] = useState<Student>(JSON.parse(JSON.stringify(getInitialForm())));
  const [openRazred, setOpenRazred] = useState<number>(1);

  const set = (field: keyof Student, val: any) => setForm(prev => ({ ...prev, [field]: val }));

  const setRazredField = (idx: number, field: keyof RazredniPodaci, val: any) => {
    setForm(prev => ({
      ...prev,
      razredi: {
        ...prev.razredi,
        [idx]: { ...prev.razredi[idx], [field]: val }
      }
    }));
  };

  const setPredmet = (razredIdx: number, predmetIdx: number, field: keyof PredmetOcena, val: string) => {
    const razred = { ...form.razredi[razredIdx] };
    const predmeti = [...razred.predmeti];
    predmeti[predmetIdx] = { ...predmeti[predmetIdx], [field]: val };
    setRazredField(razredIdx, 'predmeti', predmeti);
  };

  const addPredmet = (razredIdx: number) => {
    const predmeti = [...(form.razredi[razredIdx]?.predmeti || []), { naziv: '', ocena: '' }];
    setRazredField(razredIdx, 'predmeti', predmeti);
  };

  const removePredmet = (razredIdx: number, predmetIdx: number) => {
    const predmeti = form.razredi[razredIdx].predmeti.filter((_, i) => i !== predmetIdx);
    setRazredField(razredIdx, 'predmeti', predmeti);
  };

  const addRazred = () => {
    const next = Object.keys(form.razredi).length + 1;
    const names = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];
    setForm(prev => ({
      ...prev,
      razredi: { ...prev.razredi, [next]: emptyRazred(names[next] || String(next), '') }
    }));
    setOpenRazred(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const romanize = (n: number) => ['', 'I', 'II', 'III', 'IV', 'V', 'VI'][n] || String(n);

  return (
    <form onSubmit={handleSubmit} className="student-form">
      {/* Sticky header */}
      <div className="form-header">
        <div>
          <h2>{student ? 'Измена података ученика' : 'Унос новог ученика'}</h2>
          <p>Попуните све потребне податке за матичну књигу</p>
        </div>
        <div className="form-header-actions">
          <button type="button" onClick={onCancel} className="form-btn-cancel"><X size={16} /> Откажи</button>
          <button type="submit" className="form-btn-save"><Save size={16} /> Сачувај</button>
        </div>
      </div>

      {/* Section 1: Zaglavlje obrasca */}
      <div className="form-section">
        <div className="form-section-title"><FileText size={18} /> Идентификациони подаци обрасца</div>
        <div className="form-grid-3">
          <label>Број обрасца (бр/раз/школ/бр)<input name="brObrasca" value={form.brObrasca} onChange={e => set('brObrasca', e.target.value)} placeholder="нпр. 123/I/22/01" /></label>
          <label>Број у регистру<input name="brojURegistru" value={form.brojURegistru} onChange={e => set('brojURegistru', e.target.value)} /></label>
          <label>ЈМБГ<input name="jmbg" value={form.jmbg} onChange={e => set('jmbg', e.target.value)} maxLength={13} placeholder="13 цифара" /></label>
          <label>ЈОБ (Јединствени образовни број)<input name="job" value={form.job} onChange={e => set('job', e.target.value)} /></label>
        </div>
      </div>

      {/* Section 2: Licni podaci */}
      <div className="form-section">
        <div className="form-section-title"><User size={18} /> Лични подаци ученика</div>
        <div className="form-grid-3">
          <label>Презиме<input value={form.prezime} onChange={e => set('prezime', e.target.value)} /></label>
          <label>Име<input value={form.ime} onChange={e => set('ime', e.target.value)} /></label>
          <label>Отац / мајка / старатељ
            <select value={form.imeRoditeljaOca} onChange={e => set('imeRoditeljaOca', e.target.value)}>
              <option value="otac">отац</option>
              <option value="majka">мајка</option>
              <option value="staratelj">старатељ</option>
            </select>
          </label>
          <label>Пуно ime родитеља/старатеља<input value={form.imeRoditeljaStaratelja} onChange={e => set('imeRoditeljaStaratelja', e.target.value)} /></label>
          <label>Датум рођења<input type="date" value={form.datumRodjenja} onChange={e => set('datumRodjenja', e.target.value)} /></label>
          <label>Место рођења<input value={form.mestoRodjenja} onChange={e => set('mestoRodjenja', e.target.value)} /></label>
          <label>Општина/Област<input value={form.opstinaRodjenja} onChange={e => set('opstinaRodjenja', e.target.value)} /></label>
          <label>Држава рођења<input value={form.drzavaRodjenja} onChange={e => set('drzavaRodjenja', e.target.value)} /></label>
        </div>
      </div>

      {/* Section 3: Upis */}
      <div className="form-section">
        <div className="form-section-title"><GraduationCap size={18} /> Подаци о упису</div>
        <div className="form-grid-3">
          <label className="col-span-2">Назив школе<input value={form.skolaUpisa} onChange={e => set('skolaUpisa', e.target.value)} /></label>
          <label>Разред уписа<input value={form.razredUpisa} onChange={e => set('razredUpisa', e.target.value)} /></label>
          <label className="col-span-2">Образовни профил – смер<input value={form.obrazovniProfilSmer} onChange={e => set('obrazovniProfilSmer', e.target.value)} /></label>
          <label>ЈИСП програм<input value={form.jispProgram} onChange={e => set('jispProgram', e.target.value)} /></label>
          <label>Трајање образовања (год.)
            <input type="number" value={form.trajanjeObrazovanjaGodina} min={1} max={6}
              onChange={e => set('trajanjeObrazovanjaGodina', parseInt(e.target.value))} />
          </label>
        </div>
      </div>

      {/* Section 4: Razredi */}
      <div className="form-section">
        <div className="form-section-title">
          📋 Успех по разредима
          <button type="button" className="add-razred-btn" onClick={addRazred}><PlusCircle size={14} /> Додај разред</button>
        </div>

        {Object.entries(form.razredi).map(([idx, r]) => {
          const i = parseInt(idx);
          const isOpen = openRazred === i;
          return (
            <div key={i} className="razred-block">
              <div className="razred-header" onClick={() => setOpenRazred(isOpen ? -1 : i)}>
                <span>{romanize(i)} разред — {r.skolskaGodina}</span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              {isOpen && (
                <div className="razred-body">
                  <div className="form-grid-3">
                    <label>Школска година<input value={r.skolskaGodina} onChange={e => setRazredField(i, 'skolskaGodina', e.target.value)} placeholder="2022/2023" /></label>
                    <label>Разред (ознака)<input value={r.razred} onChange={e => setRazredField(i, 'razred', e.target.value)} /></label>
                    <label>Општи успех<input value={r.opstiUspeh} onChange={e => setRazredField(i, 'opstiUspeh', e.target.value)} /></label>
                    <label>Просечна оцена<input value={r.prosecnaOcena} onChange={e => setRazredField(i, 'prosecnaOcena', e.target.value)} /></label>
                    <label>Владање<input value={r.vladanje} onChange={e => setRazredField(i, 'vladanje', e.target.value)} /></label>
                  </div>

                  {/* Predmeti */}
                  <div className="predmeti-section">
                    <div className="predmeti-title">Предмети и оцене</div>
                    {r.predmeti.map((p, pi) => (
                      <div key={pi} className="predmet-row">
                        <input
                          className="predmet-name"
                          placeholder="Назив предмета"
                          value={p.naziv}
                          onChange={e => setPredmet(i, pi, 'naziv', e.target.value)}
                        />
                        <input
                          className="predmet-ocena"
                          placeholder="Оцена"
                          value={p.ocena}
                          onChange={e => setPredmet(i, pi, 'ocena', e.target.value)}
                          maxLength={1}
                        />
                        <button type="button" className="remove-predmet" onClick={() => removePredmet(i, pi)}><Trash2 size={14} /></button>
                      </div>
                    ))}
                    <button type="button" className="add-predmet-btn" onClick={() => addPredmet(i)}>
                      <PlusCircle size={14} /> Додај предмет
                    </button>
                  </div>

                  {/* Admin */}
                  <div className="admin-section">
                    <div className="predmeti-title">Административни записи</div>
                    <div className="form-grid-3">
                      <label>Деловодни бр. сведочанства<input value={r.delovodniBrojSvedocanstva} onChange={e => setRazredField(i, 'delovodniBrojSvedocanstva', e.target.value)} /></label>
                      <label>Датум сведочанства<input value={r.datumSvedocanstva} onChange={e => setRazredField(i, 'datumSvedocanstva', e.target.value)} /></label>
                      <label>Примио/ла сведочанство (потпис и датум)<input value={r.primiliSvedocanstvo} onChange={e => setRazredField(i, 'primiliSvedocanstvo', e.target.value)} /></label>
                      <label>Серијски број сведочанства<input value={r.serijskiBrojSvedocanstva} onChange={e => setRazredField(i, 'serijskiBrojSvedocanstva', e.target.value)} /></label>
                      <label>Потпис одељенскOg старешине<input value={r.potpisOdeljenskogStaresine} onChange={e => setRazredField(i, 'potpisOdeljenskogStaresine', e.target.value)} /></label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Section 5: Matura */}
      <div className="form-section">
        <div className="form-section-title">🎓 Матурски испит</div>
        <div className="form-grid-3">
          <label>Тип испита<input value={form.matura.tipIspita} onChange={e => setForm(p => ({ ...p, matura: { ...p.matura, tipIspita: e.target.value } }))} placeholder="мaturski / завршни..." /></label>
          <label>Рок полагања<input value={form.matura.rokPolaganja} onChange={e => setForm(p => ({ ...p, matura: { ...p.matura, rokPolaganja: e.target.value } }))} placeholder="јунски, августовски..." /></label>
          <label>Школска година матуре<input value={form.matura.skolskaGodina} onChange={e => setForm(p => ({ ...p, matura: { ...p.matura, skolskaGodina: e.target.value } }))} /></label>
          <label>Година полагања<input value={form.matura.godinaPolaganja} onChange={e => setForm(p => ({ ...p, matura: { ...p.matura, godinaPolaganja: e.target.value } }))} /></label>
        </div>
        
        <div className="predmeti-title" style={{ marginTop: '1rem' }}>Предмети/тест – стручно-теоријска знања</div>
        {form.matura.predmetiZnanje.map((p, pi) => (
          <div key={pi} className="predmet-row">
            <input className="predmet-name" placeholder="Назив предмета" value={p.naziv}
              onChange={e => {
                const arr = [...form.matura.predmetiZnanje];
                arr[pi] = { ...arr[pi], naziv: e.target.value };
                setForm(prev => ({ ...prev, matura: { ...prev.matura, predmetiZnanje: arr } }));
              }} />
            <input className="predmet-ocena" placeholder="Оцена" value={p.ocena}
              onChange={e => {
                const arr = [...form.matura.predmetiZnanje];
                arr[pi] = { ...arr[pi], ocena: e.target.value };
                setForm(prev => ({ ...prev, matura: { ...prev.matura, predmetiZnanje: arr } }));
              }} />
          </div>
        ))}

        <div className="predmeti-title" style={{ marginTop: '1rem' }}>Матурски/практични рад</div>
        <div className="form-grid-3">
          <label className="col-span-3">Назив рада<input value={form.matura.maturskiRad.nazivRada}
            onChange={e => setForm(p => ({ ...p, matura: { ...p.matura, maturskiRad: { ...p.matura.maturskiRad, nazivRada: e.target.value } } }))} /></label>
          <label>Оцена израде<input value={form.matura.maturskiRad.ocenaIzrade}
            onChange={e => setForm(p => ({ ...p, matura: { ...p.matura, maturskiRad: { ...p.matura.maturskiRad, ocenaIzrade: e.target.value } } }))} /></label>
          <label>Оцена одбране<input value={form.matura.maturskiRad.ocenaOdbrane}
            onChange={e => setForm(p => ({ ...p, matura: { ...p.matura, maturskiRad: { ...p.matura.maturskiRad, ocenaOdbrane: e.target.value } } }))} /></label>
          <label>Коначна оцена рада<input value={form.matura.maturskiRad.ocenaRada}
            onChange={e => setForm(p => ({ ...p, matura: { ...p.matura, maturskiRad: { ...p.matura.maturskiRad, ocenaRada: e.target.value } } }))} /></label>
          <label>Укупна оцена<input value={form.matura.ukupnaOcena}
            onChange={e => setForm(p => ({ ...p, matura: { ...p.matura, ukupnaOcena: e.target.value } }))} /></label>
          <label>Успех<input value={form.matura.uspeh} placeholder="одличан, врло добар..."
            onChange={e => setForm(p => ({ ...p, matura: { ...p.matura, uspeh: e.target.value } }))} /></label>
        </div>
      </div>

      {/* Section 6: Napomene */}
      <div className="form-section">
        <div className="form-section-title">📝 Напомене</div>
        <textarea rows={4} value={form.napomene} onChange={e => set('napomene', e.target.value)}
          placeholder="Унесите напомене ако постоје..."
          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem' }}
        />
      </div>
    </form>
  );
};
