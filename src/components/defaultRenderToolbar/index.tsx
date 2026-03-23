import * as React from "react";
import type { SchedulerToolbarRenderArgs } from "../../types";
import { Button } from "../ui/button";

type DefaultRenderToolbarProps = SchedulerToolbarRenderArgs & {
  prevButtonLabel?: React.ReactNode;
  nextButtonLabel?: React.ReactNode;
};

export function defaultRenderToolbar({
  goToPreviousDay,
  goToNextDay,
  defaultDatePicker,
  prevButtonLabel = "Prev",
  nextButtonLabel = "Next"
}: DefaultRenderToolbarProps) {
  return (
    <div className="rfs-toolbar">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1 shadow-xs">
        <Button variant="outline" size="sm" onClick={goToPreviousDay}>
          {prevButtonLabel}
        </Button>
        {defaultDatePicker}
        <Button variant="outline" size="sm" onClick={goToNextDay}>
          {nextButtonLabel}
        </Button>
      </div>
    </div>
  );
}
