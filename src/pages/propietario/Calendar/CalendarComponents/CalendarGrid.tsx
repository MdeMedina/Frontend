import { CalendarDay } from './CalendarDay';
import type { CalendarEvent } from '../useCalendar';

interface CalendarGridProps {
  daysInMonthCount: number;
  firstDayOfMonth: number;
  currentYear: number;
  currentMonth: number;
  eventsByDay: Record<number, CalendarEvent[]>;
  onEventClick: (stay: any) => void;
}

const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const CalendarGrid = ({
  daysInMonthCount,
  firstDayOfMonth,
  currentYear,
  currentMonth,
  eventsByDay,
  onEventClick,
}: CalendarGridProps) => {
  const today = new Date();
  const checkIfToday = (day: number) => 
    today.getDate() === day && 
    today.getMonth() === currentMonth && 
    today.getFullYear() === currentYear;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-100">
      <div className="grid grid-cols-7 bg-white shadow-xl max-w-full mx-auto border-l border-t border-slate-200">
        {/* Días de la semana */}
        {dayNames.map((day) => (
          <div key={day} className="p-4 text-center border-b border-r border-slate-200 bg-slate-50/80">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              {day}
            </span>
          </div>
        ))}

        {/* Espacios vacíos antes del primer día */}
        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <div key={`empty-${index}`} className="min-h-[110px] bg-slate-50/30 border-b border-r border-slate-200"></div>
        ))}

        {/* Días del mes */}
        {Array.from({ length: daysInMonthCount }).map((_, index) => {
          const day = index + 1;
          return (
            <CalendarDay
              key={day}
              day={day}
              isToday={checkIfToday(day)}
              events={eventsByDay[day] || []}
              onEventClick={onEventClick}
            />
          );
        })}
        
        {/* Espacios vacíos después del último día para completar la cuadrícula (opcional) */}
        {Array.from({ length: (7 - (daysInMonthCount + firstDayOfMonth) % 7) % 7 }).map((_, index) => (
          <div key={`empty-end-${index}`} className="min-h-[110px] bg-slate-50/30 border-b border-r border-slate-200"></div>
        ))}
      </div>
    </div>
  );
};
