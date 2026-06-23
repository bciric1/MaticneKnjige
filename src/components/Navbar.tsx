import { Book, PlusCircle, LayoutDashboard, Settings2, Upload, Download, FileJson, TrendingUp } from 'lucide-react';

interface NavbarProps {
  onLanding: () => void;
  onHome: () => void;
  onAdd: () => void;
  onCalibration: () => void;
  onImport: () => void;
  onExportJson?: () => void;
  onImportJson?: () => void;
  onGrades: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onLanding, onHome, onAdd, onCalibration, onImport, onExportJson, onImportJson, onGrades 
}) => {
  return (
    <nav className="app-navbar no-print">
      <div className="navbar-brand" onClick={onLanding}>
        <div className="brand-icon"><Book size={22} /></div>
        <div>
          <span className="brand-title">Алати за наставнике</span>
        </div>
      </div>
      <div className="navbar-actions">
        <button onClick={onHome} className="nav-btn ghost">
          <LayoutDashboard size={17} />
          Списак ученика
        </button>
        <button onClick={onGrades} className="nav-btn ghost">
          <TrendingUp size={17} />
          Процена Успеха
        </button>
        <button onClick={onCalibration} className="nav-btn ghost">
          <Settings2 size={17} />
          Подешавање штампе
        </button>
        <button onClick={onImport} className="nav-btn ghost">
          <Upload size={17} />
          Увези из еДневника
        </button>
        {onExportJson && (
          <button onClick={onExportJson} className="nav-btn ghost" title="Сними све податке у JSON фајл">
            <Download size={17} />
            Сними JSON
          </button>
        )}
        {onImportJson && (
          <button onClick={onImportJson} className="nav-btn ghost" title="Учитај податке из JSON фајла">
            <FileJson size={17} />
            Учитај JSON
          </button>
        )}
        <button onClick={onAdd} className="nav-btn primary">
          <PlusCircle size={17} />
          Нови Ученик
        </button>
      </div>
    </nav>
  );
};

