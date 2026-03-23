import * as React from "react";
import { format } from "date-fns";
import type { DefaultRenderDatePickerProps } from "./types";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export function defaultRenderDatePicker({ selectedDate, onSelectedDateChange }: DefaultRenderDatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="min-w-40 justify-start text-left font-normal">
          {format(selectedDate, "PPP")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="center">
        <Calendar selected={selectedDate} onSelect={onSelectedDateChange} />
      </PopoverContent>
    </Popover>
  );
}
