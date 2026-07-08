import React, { useState, useEffect } from 'react';
import { FiSave, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

export default function TemplateSettings() {
  const [template, setTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    try {
      const res = await fetch(`${apiUrl}/template`);
      if (res.ok) {
        const data = await res.json();
        setTemplate(data.content);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${apiUrl}/template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: template })
      });
      if (res.ok) {
        setStatus('success');
        setTimeout(() => setStatus(null), 3000);
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
    setLoading(false);
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Configuración de Plantilla PDF</h2>
        <p className="text-slate-400">
          Modifica el texto que se generará en el documento PDF final. Puedes usar variables entre llaves, por ejemplo: <code className="bg-slate-800 text-premium-secondary px-1 py-0.5 rounded">{'{nombre}'}</code>, <code className="bg-slate-800 text-premium-secondary px-1 py-0.5 rounded">{'{cedula}'}</code>, <code className="bg-slate-800 text-premium-secondary px-1 py-0.5 rounded">{'{carrera}'}</code>.
        </p>
      </div>

      <div className="glass-panel p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">Texto de la Plantilla</label>
          <textarea 
            value={template} 
            onChange={(e) => setTemplate(e.target.value)}
            className="input-field min-h-[300px] font-mono text-sm leading-relaxed whitespace-pre-wrap"
            placeholder="Estimado Director, por este medio..."
          />
        </div>

        <div className="mt-6 border-t border-slate-700/50 pt-4">
          <div className="text-sm font-medium mb-3 text-slate-300">
            Variables Disponibles (Arrastra la pastilla al cuadro de texto):
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {['{nombre}', '{cedula}', '{carrera}', '{facultad}', '{universidad}', '{horas}', '{turno}', '{fecha_inicio}', '{fecha_salida}', '{correo}', '{telefono}', '{estado}'].map((variable) => (
              <div 
                key={variable}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', variable)}
                className="cursor-move bg-slate-800 text-premium-secondary px-3 py-1.5 rounded-lg border border-slate-600/50 text-sm font-mono hover:bg-slate-700 hover:border-premium-secondary/50 transition-colors shadow-sm"
                title="Arrastrar y soltar"
              >
                {variable}
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <div></div>
            <div className="flex items-center gap-4">
              {status === 'success' && <span className="text-emerald-400 flex items-center gap-1"><FiCheckCircle /> Guardado con éxito</span>}
              {status === 'error' && <span className="text-red-400 flex items-center gap-1"><FiAlertCircle /> Error al guardar</span>}
              
              <button 
                onClick={handleSave} 
                disabled={loading} 
                className="btn-primary flex items-center gap-2"
              >
                {loading ? 'Guardando...' : <><FiSave /> Guardar Plantilla</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
