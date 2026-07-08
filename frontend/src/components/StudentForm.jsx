import React, { useState, useEffect } from 'react';
import { FiSave, FiAlertCircle } from 'react-icons/fi';
import DuplicateResolutionModal from './DuplicateResolutionModal';

export default function StudentForm({ initialData, file, onSuccess }) {
  const [formData, setFormData] = useState({
    cedula: initialData?.cedula || '',
    nombre: initialData?.nombre || '',
    carrera: initialData?.carrera || '',
    facultad: initialData?.facultad || '',
    universidad: initialData?.universidad || '',
    horas: initialData?.horas || '',
    correo: initialData?.correo || '',
    telefono: initialData?.telefono || '',
    estado: 'pendiente',
    turno: 'matutino',
    fecha_inicio: ''
  });
  
  const [fechaSalida, setFechaSalida] = useState('');
  const [loading, setLoading] = useState(false);
  const [calculatingDate, setCalculatingDate] = useState(false);
  const [duplicateConflict, setDuplicateConflict] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (formData.fecha_inicio && formData.horas && formData.turno) {
      calculateEndDate(formData.fecha_inicio, formData.horas, formData.turno);
    }
  }, [formData.fecha_inicio, formData.horas, formData.turno]);

  const calculateEndDate = async (start, hours, turno) => {
    setCalculatingDate(true);
    try {
      const res = await fetch(`${apiUrl}/students/calculate-end-date`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha_inicio: start, horas: parseInt(hours), turno })
      });
      const data = await res.json();
      if (res.ok) setFechaSalida(data.fecha_salida);
    } catch (err) {
      console.error(err);
    } finally {
      setCalculatingDate(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const uploadPdfFile = async (studentId) => {
    const form = new FormData();
    form.append('file', file);
    await fetch(`${apiUrl}/students/${studentId}/upload-pdf`, {
      method: 'POST',
      body: form
    });
  };

  const downloadFinalPdf = async (studentId) => {
    const res = await fetch(`${apiUrl}/generate-pdf/${studentId}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificado_${formData.cedula}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      ...formData,
      horas: parseInt(formData.horas) || 0,
      fecha_inicio: formData.fecha_inicio || null,
      fecha_salida: fechaSalida || null
    };

    try {
      const res = await fetch(`${apiUrl}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (res.status === 409) {
        setDuplicateConflict({ ...payload, existingId: data.detail.id });
        setLoading(false);
        return;
      }
      
      if (res.ok) {
        if (file) {
          await uploadPdfFile(data.id);
        }
        await downloadFinalPdf(data.id);
        alert('Estudiante guardado y certificado generado exitosamente.');
        onSuccess();
      } else {
        alert(data.detail || 'Error al guardar');
      }
    } catch (err) {
      alert('Error de conexión');
    }
    setLoading(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-800/30 p-6 rounded-xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Cédula</label>
            <input type="text" name="cedula" value={formData.cedula} onChange={handleChange} required className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Nombres Completos</label>
            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Correo Electrónico</label>
            <input type="email" name="correo" value={formData.correo} onChange={handleChange} required className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Teléfono</label>
            <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} required className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Universidad</label>
              <input type="text" name="universidad" value={formData.universidad} onChange={handleChange} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Facultad</label>
              <input type="text" name="facultad" value={formData.facultad} onChange={handleChange} required className="input-field" />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-l border-slate-700/50 pl-0 md:pl-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Carrera</label>
            <input type="text" name="carrera" value={formData.carrera} onChange={handleChange} required className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Horas Necesarias</label>
              <input type="number" name="horas" value={formData.horas} onChange={handleChange} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Turno</label>
              <select name="turno" value={formData.turno} onChange={handleChange} className="input-field">
                <option value="matutino">Matutino (6h)</option>
                <option value="vespertino">Vespertino (5h)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Estado</label>
            <select name="estado" value={formData.estado} onChange={handleChange} className="input-field">
              <option value="pendiente">Pendiente</option>
              <option value="aprobado">Aprobado</option>
              <option value="en prácticas">En Prácticas</option>
              <option value="pospuesto">Pospuesto</option>
              <option value="rechazado">Rechazado</option>
              <option value="reevaluado">Reevaluado</option>
            </select>
          </div>
          
          <div className="pt-4 border-t border-slate-700/50 mt-4">
            <h4 className="text-premium-secondary font-medium mb-3">Planificación</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Fecha Inicio</label>
                <input type="date" name="fecha_inicio" value={formData.fecha_inicio} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Fecha Salida Calc.</label>
                <div className="flex items-center h-10 px-4 bg-slate-900/50 rounded-lg border border-slate-700 text-emerald-400 font-medium">
                  {calculatingDate ? 'Calculando...' : (fechaSalida || '-')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 pt-6 flex justify-end">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <FiAlertCircle className="animate-spin" /> : <FiSave />}
            {loading ? 'Guardando...' : 'Guardar y Generar PDF'}
          </button>
        </div>
      </form>

      {duplicateConflict && (
        <DuplicateResolutionModal 
          conflictData={duplicateConflict} 
          file={file}
          apiUrl={apiUrl}
          onResolved={() => {
            setDuplicateConflict(null);
            onSuccess();
          }}
          onCancel={() => setDuplicateConflict(null)}
        />
      )}
    </>
  );
}
