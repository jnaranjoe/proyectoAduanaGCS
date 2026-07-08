import React, { useState } from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

export default function DuplicateResolutionModal({ conflictData, file, apiUrl, onResolved, onCancel }) {
  const [loading, setLoading] = useState(false);

  const handleReplace = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/students/${conflictData.existingId}/resolve-duplicate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conflictData)
      });
      
      if (res.ok) {
        // Upload new PDF file to overwrite the old one
        const form = new FormData();
        form.append('file', file);
        await fetch(`${apiUrl}/students/${conflictData.existingId}/upload-pdf`, {
          method: 'POST',
          body: form
        });
        
        alert('Datos y documento actualizados correctamente.');
        onResolved();
      } else {
        alert('Error al actualizar el registro');
      }
    } catch (err) {
      alert('Error de conexión');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="glass-panel max-w-md w-full p-6 shadow-2xl shadow-premium-primary/20">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 text-amber-400">
            <FiAlertTriangle size={28} />
            <h3 className="text-xl font-bold">Estudiante Duplicado</h3>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-white">
            <FiX size={24} />
          </button>
        </div>
        
        <p className="text-slate-300 mb-6">
          Ya existe un registro en la base de datos para la cédula <strong>{conflictData.cedula}</strong>. ¿Qué deseas hacer con la nueva información de {conflictData.nombre}?
        </p>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={handleReplace} 
            disabled={loading}
            className="w-full btn-primary bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-orange-500/30"
          >
            {loading ? 'Reemplazando...' : 'Reemplazar (Actualizar Datos y PDF)'}
          </button>
          
          <button 
            onClick={onCancel} 
            disabled={loading}
            className="w-full btn-outline"
          >
            Mantener Original (Cancelar)
          </button>
        </div>
      </div>
    </div>
  );
}
