import React, { useState } from 'react';
import type { Student } from '../types';
import { Search, User, Printer, Edit, Trash2, BookOpen } from 'lucide-react';

interface StudentListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onPrint: (student: Student) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export const StudentList: React.FC<StudentListProps> = ({ students, onEdit, onPrint, onDelete, onClearAll }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = students.filter(s =>
    `${s.prezime} ${s.ime}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.jmbg.includes(searchTerm) ||
    s.brObrasca.includes(searchTerm)
  );

  return (
    <div className="student-list-wrapper">
      {/* Hero */}
      <div className="list-hero">
        <div className="hero-icon"><BookOpen size={40} /></div>
        <div>
          <h2 className="hero-title">Матична Књига Ученика</h2>
          <p className="hero-subtitle">Средња техничка школа — укупно {students.length} ученика</p>
          {students.length > 0 && (
            <button onClick={onClearAll} className="clear-all-btn">
              <Trash2 size={14} /> Обриši целу листу
            </button>
          )}
        </div>
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Претражи по имену, ЈМБГ или броју..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Cards */}
      <div className="cards-grid">
        {filtered.map(s => (
          <div key={s.id} className="student-card">
            <div className="card-avatar">
              <User size={28} />
            </div>
            <div className="card-body">
              <h3 className="student-name">{s.prezime} (oc. {s.imeRoditeljaStaratelja.split(' ')[0]}) {s.ime}</h3>
              <div className="student-meta">
                <span>Бр. обрасца: <strong>{s.brObrasca}</strong></span>
                <span>ЈМБГ: <strong>{s.jmbg}</strong></span>
                <span className="profil-badge">{s.obrazovniProfilSmer}</span>
              </div>
            </div>
            <div className="card-actions">
              <button title="Прикажи / Штампај матичну књигу" onClick={() => onPrint(s)} className="action-btn primary">
                <Printer size={16} />
                Штампај
              </button>
              <button title="Измени податке" onClick={() => onEdit(s)} className="action-btn secondary">
                <Edit size={16} />
              </button>
              <button title="Обриши" onClick={() => onDelete(s.id)} className="action-btn danger">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <p>Нема пронађених ученика.</p>
        </div>
      )}
    </div>
  );
};
