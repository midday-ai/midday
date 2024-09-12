import React, { useEffect, useRef } from "react";

interface DateInputProps {
  value?: Date;
  onChange: (date: Date) => void;
}

interface DateParts {
  day: number;
  month: number;
  year: number;
}

const DateInput: React.FC<DateInputProps> = ({ value, onChange }) => {
  const [date, setDate] = React.useState<DateParts>(() => {
    const d = value ? new Date(value) : new Date();
    return {
      day: d.getDate(),
      month: d.getMonth() + 1, // JavaScript months are 0-indexed
      year: d.getFullYear(),
    };
  });

  const monthRef = useRef<HTMLInputElement | null>(null);
  const dayRef = useRef<HTMLInputElement | null>(null);
  const yearRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const d = value ? new Date(value) : new Date();
    setDate({
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    });
  }, [value]);

  const validateDate = (field: keyof DateParts, value: number): boolean => {
    if (
      (field === "day" && (value < 1 || value > 31)) ||
      (field === "month" && (value < 1 || value > 12)) ||
      (field === "year" && (value < 1000 || value > 9999))
    ) {
      return false;
    }

    // Validate the day of the month
    const newDate = { ...date, [field]: value };
    const d = new Date(newDate.year, newDate.month - 1, newDate.day);
    return (
      d.getFullYear() === newDate.year &&
      d.getMonth() + 1 === newDate.month &&
      d.getDate() === newDate.day
    );
  };

  const handleInputChange =
    (field: keyof DateParts) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value ? Number(e.target.value) : "";
      const isValid =
        typeof newValue === "number" && validateDate(field, newValue);

      // If the new value is valid, update the date
      const newDate = { ...date, [field]: newValue };
      setDate(newDate);

      // only call onChange when the entry is valid
      if (isValid) {
        onChange(new Date(newDate.year, newDate.month - 1, newDate.day));
      }
    };

  const initialDate = useRef<DateParts>(date);

  const handleBlur =
    (field: keyof DateParts) =>
    (e: React.FocusEvent<HTMLInputElement>): void => {
      if (!e.target.value) {
        setDate(initialDate.current);
        return;
      }

      const newValue = Number(e.target.value);
      const isValid = validateDate(field, newValue);

      if (!isValid) {
        setDate(initialDate.current);
      } else {
        // If the new value is valid, update the initial value
        initialDate.current = { ...date, [field]: newValue };
      }
    };

  const handleKeyDown =
    (field: keyof DateParts) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow command (or control) combinations
      if (e.metaKey || e.ctrlKey) {
        return;
      }

      // Prevent non-numeric characters, excluding allowed keys
      if (
        !/^[0-9]$/.test(e.key) &&
        ![
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Delete",
          "Tab",
          "Backspace",
          "Enter",
        ].includes(e.key)
      ) {
        e.preventDefault();
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        let newDate = { ...date };

        if (field === "day") {
          if (date[field] === new Date(date.year, date.month, 0).getDate()) {
            newDate = { ...newDate, day: 1, month: (date.month % 12) + 1 };
            if (newDate.month === 1) newDate.year += 1;
          } else {
            newDate.day += 1;
          }
        }

        if (field === "month") {
          if (date[field] === 12) {
            newDate = { ...newDate, month: 1, year: date.year + 1 };
          } else {
            newDate.month += 1;
          }
        }

        if (field === "year") {
          newDate.year += 1;
        }

        setDate(newDate);
        onChange(new Date(newDate.year, newDate.month - 1, newDate.day));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        let newDate = { ...date };

        if (field === "day") {
          if (date[field] === 1) {
            newDate.month -= 1;
            if (newDate.month === 0) {
              newDate.month = 12;
              newDate.year -= 1;
            }
            newDate.day = new Date(newDate.year, newDate.month, 0).getDate();
          } else {
            newDate.day -= 1;
          }
        }

        if (field === "month") {
          if (date[field] === 1) {
            newDate = { ...newDate, month: 12, year: date.year - 1 };
          } else {
            newDate.month -= 1;
          }
        }

        if (field === "year") {
          newDate.year -= 1;
        }

        setDate(newDate);
        onChange(new Date(newDate.year, newDate.month - 1, newDate.day));
      }

      if (e.key === "ArrowRight") {
        if (
          e.currentTarget.selectionStart === e.currentTarget.value.length ||
          (e.currentTarget.selectionStart === 0 &&
            e.currentTarget.selectionEnd === e.currentTarget.value.length)
        ) {
          e.preventDefault();
          if (field === "month") dayRef.current?.focus();
          if (field === "day") yearRef.current?.focus();
        }
      } else if (e.key === "ArrowLeft") {
        if (
          e.currentTarget.selectionStart === 0 ||
          (e.currentTarget.selectionStart === 0 &&
            e.currentTarget.selectionEnd === e.currentTarget.value.length)
        ) {
          e.preventDefault();
          if (field === "day") monthRef.current?.focus();
          if (field === "year") dayRef.current?.focus();
        }
      }
    };

  return (
    <div className="flex items-center rounded-lg border px-1 text-sm">
      <input
        type="text"
        ref={monthRef}
        max={12}
        maxLength={2}
        value={date.month.toString()}
        onChange={handleInputChange("month")}
        onKeyDown={handleKeyDown("month")}
        onFocus={(e) => {
          if (window.innerWidth > 1024) {
            e.target.select();
          }
        }}
        onBlur={handleBlur("month")}
        className="w-6 border-none p-0 text-center outline-none"
        placeholder="M"
      />
      <span className="-mx-px opacity-20">/</span>
      <input
        type="text"
        ref={dayRef}
        max={31}
        maxLength={2}
        value={date.day.toString()}
        onChange={handleInputChange("day")}
        onKeyDown={handleKeyDown("day")}
        onFocus={(e) => {
          if (window.innerWidth > 1024) {
            e.target.select();
          }
        }}
        onBlur={handleBlur("day")}
        className="w-7 border-none p-0 text-center outline-none"
        placeholder="D"
      />
      <span className="-mx-px opacity-20">/</span>
      <input
        type="text"
        ref={yearRef}
        max={9999}
        maxLength={4}
        value={date.year.toString()}
        onChange={handleInputChange("year")}
        onKeyDown={handleKeyDown("year")}
        onFocus={(e) => {
          if (window.innerWidth > 1024) {
            e.target.select();
          }
        }}
        onBlur={handleBlur("year")}
        className="w-12 border-none p-0 text-center outline-none"
        placeholder="YYYY"
      />
    </div>
  );
};

DateInput.displayName = "DateInput";

export { DateInput };
