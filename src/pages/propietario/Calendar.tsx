import { Layout } from '../../components/Layout';
import { useCalendar, type CalendarEvent } from './Calendar/useCalendar';
import { CalendarHeader } from './Calendar/CalendarComponents/CalendarHeader';
import { CalendarGrid } from './Calendar/CalendarComponents/CalendarGrid';
import { ReservationDetailModal } from './Calendar/CalendarComponents/ReservationDetailModal';
import type { Stay } from '../../api/stays';

export const PropietarioCalendar = () => {
  const {
    loading,
    error,
    currentYear,
    currentMonth,
    filterApartment,
    setFilterApartment,
    myApartments,
    selectedStay,
    setSelectedStay,
    eventsByDay,
    daysInMonthCount,
    firstDayOfMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
  } = useCalendar();

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50 font-sans text-slate-900 border-t border-slate-100">
        
        {/* TOP CONTROLS */}
        <CalendarHeader
          currentMonth={currentMonth}
          currentYear={currentYear}
          onPrev={goToPreviousMonth}
          onNext={goToNextMonth}
          onToday={goToToday}
          myApartments={myApartments}
          filterApartment={filterApartment}
          onFilterChange={setFilterApartment}
        />

        {/* ERROR STATE */}
        {error && (
            <div className="mx-6 mt-4 p-3 bg-slate-900 border border-slate-800 rounded flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-300 shadow-xl">
                <span className="material-symbols-outlined text-white text-sm">error</span>
                <p className="text-[10px] font-bold text-white tracking-tight italic flex-1">
                    {error}
                </p>
                <button onClick={() => {}} className="text-white opacity-40 hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-sm">close</span>
                </button>
            </div>
        )}

        {/* MAIN CALENDAR CONTENT */}
        <section className="flex-1 overflow-hidden p-6 relative flex flex-col min-h-0">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse">
                <div className="w-12 h-12 rounded-full border-2 border-slate-200 border-b-slate-900 animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Sincronizando Disponibilidad...</p>
            </div>
          ) : myApartments.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-8 rounded-full bg-slate-50 border border-slate-100 shadow-inner">
                <span className="material-symbols-outlined text-6xl opacity-20">calendar_month</span>
              </div>
              <div className="text-center">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Sin Unidades Registradas</h3>
                <p className="text-[10px] font-bold text-slate-300 italic max-w-[200px] mt-1 mx-auto">
                    No hay departamentos vinculados a su perfil para mostrar en el calendario.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-[0px_8px_24px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
              <CalendarGrid
                daysInMonthCount={daysInMonthCount}
                firstDayOfMonth={firstDayOfMonth}
                currentYear={currentYear}
                currentMonth={currentMonth}
                eventsByDay={eventsByDay}
                onEventClick={setSelectedStay}
              />
            </div>
          )}
          
          {/* Status Indicators Footer */}
          <div className="shrink-0 pt-4 flex items-center justify-between px-2">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 group">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-colors cursor-help">Sistema Quirúrgico</span>
                        <div className="flex -space-x-1">
                            <div className="w-2 h-2 rounded-full bg-slate-900 border border-white"></div>
                            <div className="w-2 h-2 rounded-full bg-slate-400 border border-white"></div>
                            <div className="w-2 h-2 rounded-full bg-slate-200 border border-white"></div>
                        </div>
                    </div>
                </div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic shrink-0">
                    Surgical Calendar v2.0 • Impeccable Design System
                </p>
          </div>
        </section>
      </div>

      {/* RESERVATION DETAIL MODAL */}
      <ReservationDetailModal
        stay={selectedStay}
        isOpen={!!selectedStay}
        onClose={() => setSelectedStay(null)}
      />
    </Layout>
  );
};
