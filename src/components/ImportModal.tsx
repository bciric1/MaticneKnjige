import React, { useState } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import type { Student } from '../types';

interface ImportModalProps {
  onImport: (students: Student[]) => void;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ onImport, onClose }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleProcess = () => {
    try {
      const data = JSON.parse(jsonInput);
      if (!Array.isArray(data)) {
        throw new Error('Podaci moraju biti u obliku niza (array).');
      }
      
      // Basic validation/mapping could go here
      onImport(data as Student[]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neispravan JSON format.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content import-modal">
        <div className="modal-header">
          <h2>Uvoz podataka iz esDnevnika</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="modal-body">
          <p className="import-hint">
            Pokrenite skriptu u eDnevniku, kopirajte dobijeni JSON i nalepite ga ispod.
          </p>
          
          <textarea
            className="import-textarea"
            placeholder='[{ "ime": "Nikola", "prezime": "Petrović", ... }]'
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              setError(null);
            }}
          />

          {error && (
            <div className="import-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="import-instructions">
            <h4>Kako dobiti podatke?</h4>
            <ol>
              <li>Otvorite esDnevnik na stranici sa učenicima.</li>
              <li>Otvorite konzolu (F12 &rarr; Console).</li>
              <li>Nalepite skriptu koju ste dobili i pritisnite Enter.</li>
              <li>Kopirajte rezultat i nalepite ga ovde.</li>
            </ol>
          </div>
        </div>

        <div className="modal-footer">
          <button className="nav-btn ghost" onClick={onClose}>Odustani</button>
          <button 
            className="nav-btn primary" 
            onClick={handleProcess}
            disabled={!jsonInput.trim()}
          >
            <Upload size={17} />
            Uvezi Podatke
          </button>
        </div>
      </div>
    </div>
  );
};
