import { useState, useEffect } from 'react';
import type { Student } from './types';
import { MOCK_STUDENTS } from './mockData';
import { Navbar } from './components/Navbar';
import { StudentList } from './components/StudentList';
import { StudentForm } from './components/StudentForm';
import { RegistryView } from './components/RegistryView';
import { PrintCalibration } from './components/PrintCalibration';
import { motion, AnimatePresence } from 'framer-motion';
import { ImportModal } from './components/ImportModal';

function App() {
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('maticna_knjiga_v2');
      return saved ? JSON.parse(saved) : MOCK_STUDENTS;
    } catch {
      return MOCK_STUDENTS;
    }
  });
  const [view, setView] = useState<'list' | 'add' | 'edit' | 'print' | 'calibration'>('list');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('maticna_knjiga_v2', JSON.stringify(students));
  }, [students]);

  const handleAdd = (s: Student) => { setStudents(prev => [...prev, s]); setView('list'); };
  const handleUpdate = (s: Student) => {
    setStudents(prev => prev.map(x => x.id === s.id ? s : x));
    setView('list');
    setSelectedStudent(null);
  };
  const handleDelete = (id: string) => {
    if (window.confirm('Да ли сте сигурни да желите да обришете овог ученика?')) {
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Да ли сте сигурни да желите да обришете ЦЕЛУ листу ученика? Ова радња се не може поништити.')) {
      setStudents([]);
    }
  };

  const handleImport = (newStudents: Student[]) => {
    setStudents(prev => {
      const studentMap = new Map(prev.map(s => [s.jmbg || s.id, s]));
      
      newStudents.forEach(s => {
        const key = s.jmbg || s.id;
        const existing = studentMap.get(key);
        studentMap.set(key, {
          ...existing, // Preserve existing data
          ...s,        // Overwrite with new data
          id: existing?.id || s.id || Math.random().toString(36).substr(2, 9),
          razredi: { ...(existing?.razredi || {}), ...(s.razredi || {}) },
          matura: { ...(existing?.matura || {}), ...(s.matura || {}) }
        });
      });

      return Array.from(studentMap.values());
    });
    alert(`Успешно увезено/ажурирано ${newStudents.length} ученика.`);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(students, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "maticne_knjige_podaci.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const importedData = JSON.parse(event.target?.result as string);
          if (Array.isArray(importedData)) {
             if (window.confirm(`Пронађено је ${importedData.length} ученика. Да ли желите да додате/ажурирате ове податке?`)) {
               handleImport(importedData);
             }
          } else {
             alert('Фајл није у исправном формату.');
          }
        } catch (err) {
          alert('Грешка при читању фајла.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const fadeVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -16, transition: { duration: 0.2 } }
  };

  return (
    <div className="app-container">
      <Navbar
        onHome={() => { setView('list'); setSelectedStudent(null); }}
        onAdd={() => { setSelectedStudent(null); setView('add'); }}
        onCalibration={() => setView('calibration')}
        onImport={() => setIsImportModalOpen(true)}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
      />
      <main className="app-main">
        <AnimatePresence mode="wait">
          {view === 'list' && (
            <motion.div key="list" variants={fadeVariants} initial="hidden" animate="visible" exit="exit">
              <StudentList
                students={students}
                onEdit={s => { setSelectedStudent(s); setView('edit'); }}
                onPrint={s => { setSelectedStudent(s); setView('print'); }}
                onDelete={handleDelete}
                onClearAll={handleClearAll}
              />
            </motion.div>
          )}
          {(view === 'add' || view === 'edit') && (
            <motion.div key="form" variants={fadeVariants} initial="hidden" animate="visible" exit="exit">
              <StudentForm
                student={selectedStudent}
                onSubmit={selectedStudent ? handleUpdate : handleAdd}
                onCancel={() => { setView('list'); setSelectedStudent(null); }}
              />
            </motion.div>
          )}
          {view === 'print' && selectedStudent && (
            <motion.div key="print" variants={fadeVariants} initial="hidden" animate="visible" exit="exit">
              <RegistryView
                student={selectedStudent}
                onBack={() => { setView('list'); setSelectedStudent(null); }}
                onNext={students.indexOf(selectedStudent) < students.length - 1 ? () => setSelectedStudent(students[students.indexOf(selectedStudent) + 1]) : undefined}
                onPrev={students.indexOf(selectedStudent) > 0 ? () => setSelectedStudent(students[students.indexOf(selectedStudent) - 1]) : undefined}
              />
            </motion.div>
          )}
          {view === 'calibration' && (
            <motion.div key="calibration" variants={fadeVariants} initial="hidden" animate="visible" exit="exit">
              <PrintCalibration
                mockStudent={students[0] || MOCK_STUDENTS[0]}
                onBack={() => setView('list')}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {isImportModalOpen && (
          <ImportModal 
            onImport={handleImport} 
            onClose={() => setIsImportModalOpen(false)} 
          />
        )}
      </main>
      <footer className="app-footer no-print">
        &copy; 2026 Матична Књига Ученика — Средња техничка школа
      </footer>
    </div>
  );
}

export default App;
