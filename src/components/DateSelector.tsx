import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";

// Register Spanish locale
registerLocale("es", es);

interface DateSelectorProps {
  label: string;
  date: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  className?: string;
  placeholder?: string;
}

export const DateSelector = ({
  label,
  date,
  onChange,
  minDate,
  className = "",
  placeholder = "Seleccionar fecha"
}: DateSelectorProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(date);

  useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  const handleDateChange = (d: Date | null) => {
    setSelectedDate(d);
    onChange(d);
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          locale="es"
          dateFormat="dd/MM/yyyy"
          minDate={minDate}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          placeholderText={placeholder}
          wrapperClassName="w-full"
        />
        <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-sm pointer-events-none">
          calendar_today
        </span>
      </div>
    </div>
  );
};
