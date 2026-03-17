import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { Clock } from "lucide-react";

// Register Spanish locale
registerLocale("es", es);

interface DateTimeSelectorProps {
  label: string;
  date: Date | null;
  time: string; // Format "HH:mm"
  onChange: (date: Date | null, time: string) => void;
  minDate?: Date;
  className?: string;
}

export const DateTimeSelector = ({
  label,
  date,
  time,
  onChange,
  minDate,
  className = "",
}: DateTimeSelectorProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(date);
  const [selectedTime, setSelectedTime] = useState<string>(time || "12:00");

  useEffect(() => {
    setSelectedDate(date);
    if (time) setSelectedTime(time);
  }, [date, time]);

  const handleDateChange = (d: Date | null) => {
    setSelectedDate(d);
    onChange(d, selectedTime);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTime = e.target.value;
    setSelectedTime(newTime);
    onChange(selectedDate, newTime);
  };

  // Generate time options (every 15 mins for better granularity)
  const timeOptions = [];
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 60; j += 15) {
      const hour = i.toString().padStart(2, "0");
      const minute = j.toString().padStart(2, "0");
      timeOptions.push(`${hour}:${minute}`);
    }
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-2 w-full">
        {/* Date Part */}
        <div className="flex-grow relative">
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            locale="es"
            dateFormat="dd/MM/yyyy"
            minDate={minDate}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-gray-900"
            placeholderText="Fecha"
            wrapperClassName="w-full"
            popperPlacement="bottom-start"
          />
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-sm pointer-events-none">
            event
          </span>
        </div>

        {/* Time Part - Separate Input */}
        <div className="w-32 relative flex-shrink-0">
          <select
            value={selectedTime}
            onChange={handleTimeChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-9 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white cursor-pointer text-gray-900"
          >
            {timeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <Clock className="absolute left-3 top-2.5 text-gray-400 w-4 h-4 pointer-events-none" />
          <span className="absolute right-2 top-3 text-gray-400 pointer-events-none text-xs">
            ▼
          </span>
        </div>
      </div>
    </div>
  );
};
