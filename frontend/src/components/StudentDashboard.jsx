import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiEdit2, FiDownload, FiCheck, FiX, FiEdit, FiTrash2 } from 'react-icons/fi';
import EditStudentModal from './EditStudentModal';

export default function StudentDashboard() {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  
  const [selectedEstado, setSelectedEstado] = useState('');
  const [selectedCarrera, setSelectedCarrera] = useState('');
  const [selectedUniversidad, setSelectedUniversidad] = useState('');
  const [selectedMes, setSelectedMes] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const url = searchTerm 
        ? `${apiUrl}/students?search=${encodeURIComponent(searchTerm)}`
        : `${apiUrl}/students`;
      const res = await fetch(url);
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, searchTerm]);

  useEffect(() => {
    // Debounce search
    const delayDebounceFn = setTimeout(() => {
      fetchStudents();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchStudents]);

  const handleUpdateStatus = async (id) => {
    try {
      const res = await fetch(`${apiUrl}/students/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newStatus })
      });
      if (res.ok) {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, estado: newStatus } : s));
        setEditingStatusId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadPdf = async (id, cedula) => {
    try {
      const res = await fetch(`${apiUrl}/generate-pdf/${id}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Certificado_${cedula}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar a ${name}? Esta acción no se puede deshacer.`)) {
      return;
    }
    
    try {
      const res = await fetch(`${apiUrl}/students/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Estudiante eliminado.');
        fetchStudents();
      } else {
        alert('Error al eliminar estudiante.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pendiente': return 'bg-slate-500/20 text-slate-300 border-slate-500/50';
      case 'aprobado': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      case 'en prácticas': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'pospuesto': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'rechazado': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'reevaluado': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  const uniqueCarreras = [...new Set(students.map(s => s.carrera).filter(Boolean))].sort();
  const uniqueUniversidades = [...new Set(students.map(s => s.universidad).filter(Boolean))].sort();

  const meses = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
  ];

  const filteredStudents = students.filter(student => {
    const matchEstado = selectedEstado ? student.estado === selectedEstado : true;
    const matchCarrera = selectedCarrera ? student.carrera === selectedCarrera : true;
    const matchUniversidad = selectedUniversidad ? student.universidad === selectedUniversidad : true;
    
    let matchMes = true;
    if (selectedMes) {
      if (!student.fecha_salida) {
        matchMes = false;
      } else {
        const parts = student.fecha_salida.split('-'); // YYYY-MM-DD
        matchMes = parts[1] === selectedMes;
      }
    }
    
    return matchEstado && matchCarrera && matchUniversidad && matchMes;
  });

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-slate-700/50 pb-6">
        <h2 className="text-2xl font-semibold">Directorio de Estudiantes</h2>
        
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-slate-400" />
          </div>
          <input
            type="text"
            className="input-field pl-10"
            placeholder="Buscar por nombre o cédula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* FILTROS INTERACTIVOS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 bg-slate-800/20 p-4 rounded-xl border border-slate-700/30">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Estado</label>
          <select 
            value={selectedEstado} 
            onChange={(e) => setSelectedEstado(e.target.value)}
            className="input-field py-1.5 px-3 text-sm h-10 w-full"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobado">Aprobado</option>
            <option value="en prácticas">En Prácticas</option>
            <option value="pospuesto">Pospuesto</option>
            <option value="rechazado">Rechazado</option>
            <option value="reevaluado">Reevaluado</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Carrera</label>
          <select 
            value={selectedCarrera} 
            onChange={(e) => setSelectedCarrera(e.target.value)}
            className="input-field py-1.5 px-3 text-sm h-10 w-full"
          >
            <option value="">Todas las carreras</option>
            {uniqueCarreras.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Universidad</label>
          <select 
            value={selectedUniversidad} 
            onChange={(e) => setSelectedUniversidad(e.target.value)}
            className="input-field py-1.5 px-3 text-sm h-10 w-full"
          >
            <option value="">Todas las U</option>
            {uniqueUniversidades.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Mes de Salida</label>
          <select 
            value={selectedMes} 
            onChange={(e) => setSelectedMes(e.target.value)}
            className="input-field py-1.5 px-3 text-sm h-10 w-full"
          >
            <option value="">Cualquier mes</option>
            {meses.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        <div className="flex items-end col-span-2 md:col-span-1">
          <button
            onClick={() => {
              setSelectedEstado('');
              setSelectedCarrera('');
              setSelectedUniversidad('');
              setSelectedMes('');
              setSearchTerm('');
            }}
            className="btn-outline h-10 w-full flex items-center justify-center gap-2 py-1 text-sm border-slate-700 text-slate-400 hover:text-white"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {loading && students.length === 0 ? (
        <div className="text-center py-10 text-slate-400 animate-pulse">Cargando base de datos...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-10 text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/50">
          No se encontraron estudiantes con los filtros seleccionados.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-sm">
                <th className="pb-3 font-medium px-4">Estudiante</th>
                <th className="pb-3 font-medium px-4">Carrera</th>
                <th className="pb-3 font-medium px-4">Fechas</th>
                <th className="pb-3 font-medium px-4">Estado</th>
                <th className="pb-3 font-medium px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-4">
                    <p className="font-medium text-slate-200">{student.nombre}</p>
                    <p className="text-slate-400 text-xs">{student.cedula}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p>{student.carrera}</p>
                    <p className="text-xs text-slate-400">{student.universidad}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-slate-300">In: {student.fecha_inicio || '-'}</p>
                    <p className="text-slate-400">Out: {student.fecha_salida || '-'}</p>
                  </td>
                  <td className="py-4 px-4">
                    {editingStatusId === student.id ? (
                      <div className="flex items-center gap-2">
                        <select 
                          className="input-field py-1 px-2 text-xs h-auto w-32" 
                          value={newStatus} 
                          onChange={(e) => setNewStatus(e.target.value)}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="aprobado">Aprobado</option>
                          <option value="en prácticas">En Prácticas</option>
                          <option value="pospuesto">Pospuesto</option>
                          <option value="rechazado">Rechazado</option>
                          <option value="reevaluado">Reevaluado</option>
                        </select>
                        <button onClick={() => handleUpdateStatus(student.id)} className="text-emerald-400 hover:text-emerald-300 p-1 bg-emerald-400/10 rounded">
                          <FiCheck size={16} />
                        </button>
                        <button onClick={() => setEditingStatusId(null)} className="text-slate-400 hover:text-white p-1 bg-slate-700/50 rounded">
                          <FiX size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(student.estado)}`}>
                          {student.estado.toUpperCase()}
                        </span>
                        <button 
                          onClick={() => { setEditingStatusId(student.id); setNewStatus(student.estado); }} 
                          className="text-slate-500 hover:text-premium-secondary transition-colors"
                          title="Cambiar estado"
                        >
                          <FiEdit2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setEditingStudent(student)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors text-xs font-medium text-slate-300"
                      >
                        <FiEdit size={14} /> Editar
                      </button>
                      
                      <button 
                        onClick={() => handleDownloadPdf(student.id, student.cedula)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-premium-primary/20 text-premium-secondary border border-premium-primary/30 rounded-lg hover:bg-premium-primary/40 transition-colors text-xs font-medium"
                      >
                        <FiDownload size={14} /> PDF
                      </button>

                      <button 
                        onClick={() => handleDeleteStudent(student.id, student.nombre)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-950/20 text-red-400 border border-red-900/30 rounded-lg hover:bg-red-900/30 transition-colors text-xs font-medium"
                        title="Eliminar Estudiante"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingStudent && (
        <EditStudentModal 
          student={editingStudent}
          onSaved={() => {
            setEditingStudent(null);
            fetchStudents();
          }}
          onCancel={() => setEditingStudent(null)}
        />
      )}
    </div>
  );
}
