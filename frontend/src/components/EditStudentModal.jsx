import React, { useState, useEffect } from 'react';
import { FiSave, FiX, FiAlertCircle } from 'react-icons/fi';

export default function EditStudentModal({ student, onSaved, onCancel }) {
  const [formData, setFormData] = useState({
    cedula: student.cedula || '',
    nombre: student.nombre || '',
    carrera: student.carrera || '',
    facultad: student.facultad || '',
    universidad: student.universidad || '',
    horas: student.horas || '',
    correo: student.correo || '',
    telefono: student.telefono || '',
    estado: student.estado || 'pendiente',
    turno: student.turno || 'matutino',
    fecha_inicio: student.fecha_inicio || ''
  });

  const [fechaSalida, setFechaSalida] = useState(student.fecha_salida || '');
  const [loading, setLoading] = useState(false);
  const [calculatingDate, setCalculatingDate] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (formData.fecha_inicio && formData.horas && formData.turno) {
      calculateEndDate(formData.fecha_inicio, formData.horas, formData.turno);
    }
  }, [formData.fecha_inicio, formData.horas, formData.turno]);

  const calculateEndDate = async (start, hours, shift) => {
    setCalculatingDate(true);
    try {
      const res = await fetch(`${apiUrl}/students/calculate-end-date`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha_inicio: start, horas: parseInt(hours), turno: shift })
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
      const res = await fetch(`${apiUrl}/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert('Estudiante actualizado con éxito.');
        onSaved();
      } else {
        const data = await res.json();
        alert(data.detail || 'Error al actualizar');
      }
    } catch (err) {
      alert('Error de conexión');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-4xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
          <h3 className="text-2xl font-bold text-premium-secondary">Editar Estudiante</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div className="col-span-1 md:col-span-2 pt-6 flex justify-end gap-3 border-t border-slate-700">
            <button type="button" onClick={onCancel} className="btn-outline">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <FiAlertCircle className="animate-spin" /> : <FiSave />}
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
