import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiFileText, FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';
import StudentForm from './StudentForm';

export default function DragDropZone() {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [error, setError] = useState(null);
  const [isManualRegister, setIsManualRegister] = useState(false);

  const onDrop = useCallback(acceptedFiles => {
    const pdfFiles = acceptedFiles.filter(f => f.type === 'application/pdf');
    setFiles(prev => [...prev, ...pdfFiles]);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] }
  });

  const processFile = async (file) => {
    setProcessing(true);
    setError(null);
    setCurrentFile(file);
    
    const formData = new FormData();
    formData.append('file', file);
    
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    try {
      const response = await fetch(`${apiUrl}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Error al procesar el documento');
      }
      
      const data = await response.json();
      setExtractedData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    // Only reset the current extraction, keep the rest of the files
    setExtractedData(null);
    setCurrentFile(null);
    setError(null);
  };

  const removeFile = (fileToRemove) => {
    setFiles(files.filter(f => f !== fileToRemove));
  };

  if (extractedData || isManualRegister) {
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
          <div className="flex items-center gap-3 text-emerald-400">
            <FiCheckCircle size={24} />
            <h2 className="text-xl font-semibold">
              {isManualRegister ? 'Registro Manual de Estudiante' : `Extracción Exitosa: ${currentFile?.name}`}
            </h2>
          </div>
          <button onClick={() => {
            handleReset();
            setIsManualRegister(false);
            if (currentFile) removeFile(currentFile);
          }} className="text-slate-400 hover:text-white transition-colors">
            Cancelar
          </button>
        </div>
        
        <StudentForm 
          initialData={extractedData || {}} 
          file={currentFile} 
          onSuccess={() => {
            handleReset();
            setIsManualRegister(false);
            if (currentFile) removeFile(currentFile);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div 
        {...getRootProps()} 
        className={`w-full max-w-2xl p-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300
          ${isDragActive ? 'border-premium-primary bg-premium-primary/10' : 'border-slate-600 hover:border-premium-secondary hover:bg-slate-800/50'}`}
      >
        <input {...getInputProps()} />
        <div className="bg-slate-800 p-4 rounded-full mb-4 shadow-lg">
          <FiUpload size={32} className={isDragActive ? 'text-premium-primary' : 'text-slate-400'} />
        </div>
        <h3 className="text-xl font-medium mb-2 text-center">
          {isDragActive ? 'Suelta el PDF aquí...' : 'Arrastra un PDF aquí, o haz clic para seleccionar'}
        </h3>
        <p className="text-slate-400 text-sm text-center">
          Formatos soportados: Solo .pdf (Documentos exportados o escaneados)
        </p>
      </div>

      <div className="mt-6">
        <button 
          onClick={() => setIsManualRegister(true)}
          className="btn-outline border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          Registro Manual
        </button>
      </div>

      {files.length > 0 && !processing && (
        <div className="mt-8 w-full max-w-2xl space-y-3">
          <h3 className="text-lg font-medium text-slate-300 mb-2">Archivos Pendientes ({files.length})</h3>
          {files.map((file, index) => (
            <div key={index} className="glass-panel p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FiFileText className="text-premium-secondary" size={24} />
                <div>
                  <p className="font-medium text-sm md:text-base truncate max-w-[200px] md:max-w-xs">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => removeFile(file)}
                  className="btn-outline px-3 py-1 text-sm border-slate-600/50 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                >
                  <FiXCircle />
                </button>
                <button 
                  onClick={() => processFile(file)}
                  className="btn-primary px-4 py-1.5 text-sm"
                >
                  Extraer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {processing && (
        <div className="mt-8 flex flex-col items-center text-premium-secondary">
          <FiLoader className="animate-spin mb-4" size={32} />
          <p className="font-medium animate-pulse">Procesando documento con OCR local...</p>
        </div>
      )}

      {error && (
        <div className="mt-8 w-full max-w-2xl bg-red-900/30 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-400">
          <FiXCircle size={24} />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
