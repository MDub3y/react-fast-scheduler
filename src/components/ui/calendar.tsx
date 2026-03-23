import * as React from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek
} from "date-fns";
import { cn } from "../../lib/cn";
import { Button } from "./button";

export function Calendar({
  selected,
  onSelect
}: {
  selected?: Date;
  onSelect?: (date: Date) => void;
}) {
  const [month, setMonth] = React.useState(selected ?? new Date());

  React.useEffect(() => {
    if (selected) {
      setMonth(selected);
    }
  }, [selected]);

  const monthStart = startOfMonth(month);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days: Date[] = [];

  for (let day = calendarStart; day <= calendarEnd; day = addDays(day, 1)) {
    days.push(day);
  }

  return (
    <div className="w-72 rounded-md bg-popover">
      <div className="mb-2 flex items-center justify-between">
        <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}>
          {"<"}
        </Button>
        <div className="text-sm font-medium">{format(month, "MMMM yyyy")}</div>
        <Button variant="ghost" size="icon" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}>
          {">"}
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isSelected = selected ? isSameDay(day, selected) : false;
          return (
            <Button
              key={day.toISOString()}
              variant={isSelected ? "default" : "ghost"}
              size="icon"
              className={cn(
                "text-xs",
                !isSameMonth(day, month) && "text-muted-foreground opacity-60",
                isToday(day) && !isSelected && "border border-border"
              )}
              onClick={() => onSelect?.(day)}
            >
              {format(day, "d")}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
