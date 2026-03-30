import { Modal } from '../../../../../components/Modal';
import type { CreatePetitionDto } from '../../../../../api/petitions';

interface UpsertPetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newPetitionData: CreatePetitionDto;
  setNewPetitionData: (data: any) => void;
  selectedOption: string;
  onOptionChange: (id: string) => void;
  petitionOptions: any[];
  apartments: any[];
  apartmentSearchTerm: string;
  setApartmentSearchTerm: (term: string) => void;
  formData: any;
  setFormData: (data: any) => void;
  getRequiredFields: (id: string) => any;
  handleRutInput: (val: string) => string;
  cleanRut: (val: string) => string;
}

export const UpsertPetitionModal = ({
  isOpen, onClose, onSubmit, newPetitionData, setNewPetitionData,
  selectedOption, onOptionChange, petitionOptions,
  apartments, apartmentSearchTerm, setApartmentSearchTerm,
  formData, setFormData, getRequiredFields, handleRutInput, cleanRut
}: UpsertPetitionModalProps) => {

  const requiredFields = getRequiredFields(selectedOption);

  const Input = ({ label, type = 'text', value, onChange, placeholder, required = false, mono = false }: any) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label} {required && '*'}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2 bg-white border border-slate-200 rounded text-[12px] font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-colors shadow-sm ${mono ? 'font-mono' : ''}`}
      />
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generar Petición Quirúrgica"
      width="max-w-3xl"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Type Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {petitionOptions.map((option) => (
            <label
              key={option.id}
              className={`
                flex items-start p-3 border rounded-lg cursor-pointer transition-all
                ${selectedOption === option.id 
                  ? 'bg-slate-900 border-slate-900 shadow-md translate-x-[2px] translate-y-[2px]' 
                  : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'}
              `}
            >
              <input
                type="radio"
                name="petitionOption"
                value={option.id}
                checked={selectedOption === option.id}
                onChange={(e) => onOptionChange(e.target.value)}
                className="sr-only"
              />
              <div className="flex-1">
                <div className={`text-[11px] font-black uppercase tracking-widest ${selectedOption === option.id ? 'text-white' : 'text-slate-900'}`}>
                  {option.title}
                </div>
                {option.description && (
                  <div className={`text-[9px] font-bold mt-1 ${selectedOption === option.id ? 'text-slate-400' : 'text-slate-400'}`}>
                    {option.description}
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>

        {/* Dynamic Fields Section */}
        {selectedOption && (
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            
            {/* Apartment Selection */}
            {requiredFields.needsApartment && (
              <div className="space-y-3">
                <Input 
                  label="Unidad / Departamento" 
                  placeholder="Número de depto..."
                  value={apartmentSearchTerm}
                  onChange={(e: any) => setApartmentSearchTerm(e.target.value)}
                />
                <div className="max-h-32 overflow-y-auto bg-white border border-slate-200 rounded divide-y divide-slate-100">
                    {apartments
                      .filter(apt => 
                        apt.number.includes(apartmentSearchTerm) || 
                        (apt.building as any)?.name?.toLowerCase().includes(apartmentSearchTerm.toLowerCase())
                      )
                      .map(apt => (
                        <button
                          key={apt.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, apartmentId: apt.id })}
                          className={`w-full px-3 py-2 text-left text-[11px] font-bold hover:bg-slate-50 flex justify-between items-center ${formData.apartmentId === apt.id ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}
                        >
                          <span>Depto {apt.number} - {(apt.building as any)?.name}</span>
                          {formData.apartmentId === apt.id && <span className="material-symbols-outlined text-sm">check_circle</span>}
                        </button>
                      ))}
                </div>
              </div>
            )}

            {/* Guest Data */}
            {requiredFields.needsGuestData && (
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nombre" value={formData.guestFirstName || ''} onChange={(e: any) => setFormData({ ...formData, guestFirstName: e.target.value })} />
                <Input label="Apellido" value={formData.guestLastName || ''} onChange={(e: any) => setFormData({ ...formData, guestLastName: e.target.value })} />
                <div className="col-span-2">
                  <Input 
                    label="RUT / Documento" 
                    value={formData.guestDocument || ''} 
                    mono
                    onChange={(e: any) => setFormData({ ...formData, guestDocument: handleRutInput(e.target.value) })}
                  />
                </div>
              </div>
            )}

            {/* Other / Description */}
            {selectedOption === 'OTHER' && (
              <div className="space-y-4">
                <Input label="Asunto de la Petición" value={newPetitionData.title} onChange={(e: any) => setNewPetitionData({ ...newPetitionData, title: e.target.value })} required />
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detalles Adicionales</label>
                  <textarea
                    value={newPetitionData.reason}
                    onChange={(e) => setNewPetitionData({ ...newPetitionData, reason: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-[12px] font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-colors shadow-sm"
                    placeholder="Describa la situación con precisión quirúrgica..."
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form Footer */}
        <div className="flex flex-col gap-3 pt-4">
          <button
            type="submit"
            disabled={!selectedOption}
            className={`w-full py-4 text-white text-[12px] font-black uppercase tracking-[0.3em] rounded transition-all shadow-[0px_4px_12px_rgba(0,0,0,0.1)] ${selectedOption ? 'bg-slate-900 hover:bg-black' : 'bg-slate-200 cursor-not-allowed'}`}
          >
            Emitir Petición a Torre
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors focus:outline-none"
          >
            Anular Operación
          </button>
        </div>
      </form>
    </Modal>
  );
};
