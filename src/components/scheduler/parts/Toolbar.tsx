import * as React from "react";
import { defaultRenderDatePicker } from "../../defaultRenderDatePicker";
import { defaultRenderToolbar } from "../../defaultRenderToolbar";
import { shiftDays } from "../../../utils/scheduler-core.utils";
import type { SchedulerToolbarRenderArgs } from "../../../types";

type SchedulerToolbarProps = {
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
  prevButtonLabel: React.ReactNode;
  nextButtonLabel: React.ReactNode;
  renderToolbar?: (args: SchedulerToolbarRenderArgs) => React.ReactNode;
  renderDatePicker?: (args: { selectedDate: Date; onSelectedDateChange: (date: Date) => void }) => React.ReactNode;
};

export function Toolbar({
  selectedDate,
  onSelectedDateChange,
  prevButtonLabel,
  nextButtonLabel,
  renderToolbar,
  renderDatePicker
}: SchedulerToolbarProps) {
  const goToPreviousDay = () => onSelectedDateChange(shiftDays(selectedDate, -1));
  const goToNextDay = () => onSelectedDateChange(shiftDays(selectedDate, 1));
  const defaultDatePicker = (renderDatePicker ?? defaultRenderDatePicker)({ selectedDate, onSelectedDateChange });

  if (renderToolbar) {
    return <>{renderToolbar({ selectedDate, onSelectedDateChange, goToPreviousDay, goToNextDay, defaultDatePicker })}</>;
  }

  return (
    <>
      {defaultRenderToolbar({
        selectedDate,
        onSelectedDateChange,
        goToPreviousDay,
        goToNextDay,
        defaultDatePicker,
        prevButtonLabel,
        nextButtonLabel
      })}
    </>
  );
}
