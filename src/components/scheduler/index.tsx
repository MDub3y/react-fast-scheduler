import * as React from "react";
import { defaultRenderAppointment } from "../defaultRenderAppointment";
import { defaultRenderDatePicker } from "../defaultRenderDatePicker";
import { defaultRenderResourceHeader } from "../defaultRenderResourceHeader";
import { defaultRenderToolbar } from "../defaultRenderToolbar";
import { GUTTER_W, MIN_EVENT_MIN, PX_PER_MIN, RESOURCE_MIN_W, STEP_MIN, TOP_PAD } from "../constants";
import type { BaseSchedulerResource, SchedulerId, SchedulerProps } from "../../types/scheduler";
import { useSchedulerBaseData } from "../../hooks/useSchedulerBaseData";
import { useSchedulerInteractions } from "../../hooks/useSchedulerInteractions";
import { useSchedulerPresentationData } from "../../hooks/useSchedulerPresentationData";
import { fullName, isNameLike, shiftDays } from "../../utils/scheduler-core.utils";

export function Scheduler<TAppointment, TResource extends BaseSchedulerResource<TResourceId>, TResourceId extends SchedulerId>({
  resources,
  appointments,
  selectedDate,
  onSelectedDateChange,
  adapter,
  onPersistMoveResize,
  onAppointmentChange,
  renderResourceHeader,
  renderAppointment,
  resourceAppointmentClassMap,
  getResourceAppointmentAppearance,
  getResourceAppointmentColorToken,
  appointmentColorTokenClassMap,
  getResourceAppointmentBackground,
  renderToolbar,
  renderDatePicker,
  prevButtonLabel = "Prev",
  nextButtonLabel = "Next",
  dayStart = "09:00",
  dayEnd = "18:00"
}: SchedulerProps<TAppointment, TResource, TResourceId>) {
  const {
      appointmentMap,
      dayMinutes,
      dayStartAbs,
      gridHeight,
      gridMinWidth,
      renderAppts
  } = useSchedulerBaseData({
    adapter,
    appointments,
    dayEnd,
    dayStart,
    resources,
    selectedDate
  });

  const {
      colRefs,
      drag,
      onApptPointerDown,
      onGlobalPointerMove,
      onGlobalPointerUp,
      onResizePointerDown,
      suppressClickRef
  } =
    useSchedulerInteractions({
      appointmentMap,
      dayMinutes,
      dayStartAbs,
      onAppointmentChange,
      onPersistMoveResize,
      renderAppts,
      resources,
      selectedDate
    });

  const {
    appointmentAppearanceByResource,
    appointmentBgByResource,
    laidOutByResource
  } = useSchedulerPresentationData({
      appointmentColorTokenClassMap,
      dayStartAbs,
      drag,
      getResourceAppointmentAppearance,
      getResourceAppointmentBackground,
      getResourceAppointmentColorToken,
      renderAppts,
      resourceAppointmentClassMap,
      resources,
      selectedDate
    });

  const defaultResourceHeaderRenderer = (resource: TResource) => defaultRenderResourceHeader({ resource });
  const goToPreviousDay = () => onSelectedDateChange(shiftDays(selectedDate, -1));
  const goToNextDay = () => onSelectedDateChange(shiftDays(selectedDate, 1));
  const defaultDatePicker = (renderDatePicker ?? defaultRenderDatePicker)({ selectedDate, onSelectedDateChange });
  const toolbar = renderToolbar ? (
    renderToolbar({
      selectedDate,
      onSelectedDateChange,
      goToPreviousDay,
      goToNextDay,
      defaultDatePicker
    })
  ) : (
    defaultRenderToolbar({
      selectedDate,
      onSelectedDateChange,
      goToPreviousDay,
      goToNextDay,
      defaultDatePicker,
      prevButtonLabel,
      nextButtonLabel
    })
  );

  return (
    <section
      className={`rfs-root rounded-lg bg-background text-foreground ${drag.kind === "move" ? "rfs-root--drag-move" : ""} ${drag.kind === "resize" ? "rfs-root--drag-resize" : ""}`}
      onPointerMove={onGlobalPointerMove}
      onPointerUp={onGlobalPointerUp}
      onPointerCancel={onGlobalPointerUp}
    >
      {toolbar}

      <div className="rfs-shell border-border bg-card">
        <div style={{ minWidth: gridMinWidth }}>
          <div className="rfs-header border-border bg-card">
            <div className="rfs-gutter border-border" style={{ width: GUTTER_W }} />
            {resources.map((resource) => (
              <div
                key={String(resource.id)}
                className="rfs-resource-header border-border bg-card text-foreground"
                style={{ minWidth: RESOURCE_MIN_W, flex: 1 }}
              >
                {(renderResourceHeader ?? defaultResourceHeaderRenderer)(resource)}
                {isNameLike(resource) ? <div className="rfs-resource-subtitle text-muted-foreground">{fullName(resource)}</div> : null}
              </div>
            ))}
          </div>
          <div className="rfs-body">
            <div className="rfs-times border-border bg-card" style={{ width: GUTTER_W, height: gridHeight }}>
              {Array.from({ length: Math.floor(dayMinutes / 60) + 1 }).map((_, i) => (
                <div
                  key={`tick-${i}`}
                  className="rfs-time-tick text-muted-foreground"
                  style={{ top: TOP_PAD + i * 60 * PX_PER_MIN }}
                >
                  {String(Math.floor((dayStartAbs + i * 60) / 60)).padStart(2, "0")}:
                  {String((dayStartAbs + i * 60) % 60).padStart(2, "0")}
                </div>
              ))}
            </div>
            <div className="rfs-grid">
              {resources.map((resource) => (
                <div
                  key={String(resource.id)}
                  className="rfs-col border-border bg-card"
                  style={{ minWidth: RESOURCE_MIN_W, flex: 1 }}
                >
                  <div
                    ref={(el) => {
                      colRefs.current[String(resource.id)] = el;
                    }}
                    className="rfs-col-inner bg-card"
                    style={{ height: gridHeight }}
                  >
                    {Array.from({ length: Math.floor(dayMinutes / 60) + 1 }).map((_, i) => (
                      <div
                        key={`major-${String(resource.id)}-${i}`}
                        className="rfs-hour-line border-border/70"
                        style={{ top: TOP_PAD + i * 60 * PX_PER_MIN }}
                      />
                    ))}
                    {Array.from({ length: Math.floor(dayMinutes / STEP_MIN) + 1 }).map((_, i) => (
                      <div
                        key={`minor-${String(resource.id)}-${i}`}
                        className="rfs-slot-line border-border/50"
                        style={{ top: TOP_PAD + i * STEP_MIN * PX_PER_MIN }}
                      />
                    ))}
                    {(laidOutByResource.get(resource.id) ?? []).map((appointment) => {
                      const laneWidthPct = 100 / appointment.lanes;
                      const top = TOP_PAD + appointment.startMin * PX_PER_MIN;
                      const height = Math.max(MIN_EVENT_MIN * PX_PER_MIN, (appointment.endMin - appointment.startMin) * PX_PER_MIN);
                      const appointmentAppearance = appointmentAppearanceByResource.get(resource.id);
                      const appointmentBackgroundColor = appointmentBgByResource.get(resource.id);
                      return (
                        <div
                          key={String(appointment.id)}
                          className="rfs-card-slot"
                          style={{
                            top,
                            left: `${laneWidthPct * appointment.lane}%`,
                            width: `${laneWidthPct}%`,
                            height
                          }}
                        >
                          {(renderAppointment ?? defaultRenderAppointment)({
                            appointment,
                            onPointerDown: (event) => onApptPointerDown(event, appointment),
                            onResizePointerDown: (event) => onResizePointerDown(event, appointment),
                            appointmentAppearance,
                            appointmentBackgroundColor,
                            drag,
                            suppressClickRef
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
