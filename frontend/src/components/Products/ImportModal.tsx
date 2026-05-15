import React from 'react';
import { X, Loader2, Upload } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importing: boolean;
  importResult: any;
  setImportResult: (result: any) => void;
  handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  downloadTemplate: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  importing,
  importResult,
  setImportResult,
  handleImport,
  downloadTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => !importing && onClose()}>
      <div className="theme-overlay-card w-full max-w-md rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-black theme-text uppercase tracking-tight">Importar Catálogo</h2>
          <button onClick={onClose} className="theme-muted hover:theme-text transition-colors" disabled={importing}>
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          {!importResult ? (
            <div className="space-y-6">
              <p className="theme-muted text-[11px] font-black uppercase tracking-widest text-center leading-relaxed">
                Sube un archivo <span className="theme-text">Excel</span> o <span className="theme-text">CSV</span>. El sistema actualizará automáticamente por <span className="text-primary font-bold">SKU</span>.
              </p>

              <div className="relative group">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleImport}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                  disabled={importing}
                />
                <div className="theme-input rounded-[32px] border-2 border-dashed border-white/10 group-hover:border-primary/50 transition-all p-12 flex flex-col items-center justify-center gap-4 bg-white/[0.01]">
                  {importing ? (
                    <>
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      <p className="text-primary font-black uppercase text-[10px] tracking-[0.2em]">Sincronizando...</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                        <Upload size={32} />
                      </div>
                      <div className="text-center">
                        <p className="theme-text font-black uppercase text-[10px] tracking-widest">Soltar archivo aquí</p>
                        <p className="theme-muted text-[9px] font-medium mt-1 uppercase tracking-widest">XLSX, XLS o CSV</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button 
                onClick={downloadTemplate}
                className="w-full text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:brightness-125 transition-all text-center"
              >
                Descargar Plantilla Actualizada
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="theme-surface p-5 rounded-3xl text-center border border-white/5">
                  <p className="text-green-400 text-3xl font-black">{importResult.success}</p>
                  <p className="theme-muted text-[8px] uppercase font-black tracking-widest mt-1">Nuevos</p>
                </div>
                <div className="theme-surface p-5 rounded-3xl text-center border border-white/5">
                  <p className="text-primary text-3xl font-black">{importResult.updated}</p>
                  <p className="theme-muted text-[8px] uppercase font-black tracking-widest mt-1">Actualizados</p>
                </div>
                <div className="theme-surface p-5 rounded-3xl text-center border border-white/5">
                  <p className="text-red-400 text-3xl font-black">{importResult.errors}</p>
                  <p className="theme-muted text-[8px] uppercase font-black tracking-widest mt-1">Errores</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setImportResult(null);
                  onClose();
                }}
                className="w-full py-5 bg-white/5 hover:bg-white/10 theme-text rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] transition-all border border-white/5 shadow-xl"
              >
                Finalizar y Revisar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
