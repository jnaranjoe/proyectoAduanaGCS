import { useState } from 'react';
import { FiUploadCloud, FiUsers } from 'react-icons/fi';
import DragDropZone from './components/DragDropZone';
import StudentDashboard from './components/StudentDashboard';
import TemplateSettings from './components/TemplateSettings';
import { FiSettings } from 'react-icons/fi';

function App() {
  const [activeTab, setActiveTab] = useState('upload');

  return (
    <div className="min-h-screen text-slate-200 p-8 flex flex-col items-center">
      <header className="mb-10 text-center w-full max-w-5xl">
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-premium-secondary to-premium-primary mb-4">
          Validador de Pasantías
        </h1>
        <p className="text-slate-400 text-lg">Procesamiento inteligente de documentos mediante OCR local</p>
      </header>

      <div className="w-full max-w-5xl">
        <div className="flex gap-4 mb-8 justify-center">
          <button 
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'upload' ? 'bg-premium-primary text-white shadow-lg shadow-premium-primary/20' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'}`}
          >
            <FiUploadCloud size={20} />
            Subir Documentos
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'dashboard' ? 'bg-premium-primary text-white shadow-lg shadow-premium-primary/20' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'}`}
          >
            <FiUsers size={20} />
            Gestión y Búsqueda
          </button>
          <button 
            onClick={() => setActiveTab('template')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'template' ? 'bg-premium-primary text-white shadow-lg shadow-premium-primary/20' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'}`}
          >
            <FiSettings size={20} />
            Plantilla PDF
          </button>
        </div>

        <main className="glass-panel p-6 md:p-10 w-full animate-fade-in-up">
          {activeTab === 'upload' && <DragDropZone />}
          {activeTab === 'dashboard' && <StudentDashboard />}
          {activeTab === 'template' && <TemplateSettings />}
        </main>
      </div>
    </div>
  );
}

export default App;
