import type { CalendarEvent } from '../useCalendar';

interface CalendarEventItemProps {
  event: CalendarEvent;
  onClick: () => void;
}

export const CalendarEventItem = ({ event, onClick }: CalendarEventItemProps) => {
  const isCheckIn = event.type === 'checkIn';
  const isCheckOut = event.type === 'checkOut';
  const isStaff = event.stay.category === 'STAFF';

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`
        px-2 py-1 rounded cursor-pointer transition-all border flex items-center gap-1.5 min-w-0 max-w-full
        ${isCheckIn ? 'bg-slate-900 border-transparent text-white shadow-md z-10' : 
          isCheckOut ? 'bg-white border-slate-200 text-slate-400 group-hover:text-slate-900 shadow-sm' : 
          'bg-slate-50 border-slate-100 text-slate-500'}
        hover:scale-[1.02] active:scale-95 group relative
      `}
      title={`${event.stay.apartment?.number || 'S/N'} - ${event.stay.guestFirstName || 'Personal'} ${
        isCheckIn && event.stay.actualCheckIn ? '(Check-in completado)' : 
        isCheckOut && event.stay.actualCheckOut ? '(Check-out completado)' : ''
      }`}
    >
      <span className="material-symbols-outlined text-[10px] font-black">
        {isCheckIn ? (event.stay.actualCheckIn ? 'check_circle' : 'login') : 
         isCheckOut ? (event.stay.actualCheckOut ? 'task_alt' : 'logout') : 
         isStaff ? 'engineering' : 'bed'}
      </span>
      
      <span className="text-[9px] font-black uppercase tracking-tighter truncate">
        {event.stay.apartment?.number || 'S/N'}
      </span>

      <span className="text-[9px] font-bold truncate opacity-80">
        {event.stay.guestFirstName || (isStaff ? 'Personal' : 'Reserva')}
      </span>

      {isCheckIn && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse border border-white"></span>
      )}
    </div>
  );
};

interface CalendarDayProps {
  day: number;
  isToday: boolean;
  events: CalendarEvent[];
  onEventClick: (stay: any) => void;
}

export const CalendarDay = ({ day, isToday, events, onEventClick }: CalendarDayProps) => {
  return (
    <div className={`
      min-h-[110px] border-b border-r border-slate-200 p-2 transition-colors flex flex-col gap-1
      ${isToday ? 'bg-slate-900/5' : 'bg-white hover:bg-slate-50/50'}
    `}>
      <div className="flex justify-between items-center mb-1">
        <span className={`
          text-[10px] font-black uppercase tracking-widest
          ${isToday ? 'text-slate-900 bg-slate-900/10 px-1.5 py-0.5 rounded' : 'text-slate-300'}
        `}>
          {isToday ? 'Hoy' : ''}
        </span>
        <span className={`
          text-[13px] font-black tabular-nums transition-all
          ${isToday ? 'text-slate-900 scale-125' : 'text-slate-400'}
        `}>
          {day}
        </span>
      </div>

      <div className="flex flex-col gap-1 overflow-hidden">
        {events.slice(0, 4).map((event, idx) => (
          <CalendarEventItem
            key={`${event.stay.id}-${event.type}-${idx}`}
            event={event}
            onClick={() => onEventClick(event.stay)}
          />
        ))}
        {events.length > 4 && (
          <div className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 text-center py-1 mt-auto border border-dashed border-slate-200 rounded">
            +{events.length - 4} ADICIONALES
          </div>
        )}
      </div>
    </div>
  );
};
