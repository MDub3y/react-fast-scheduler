import * as React from "react";
import { BOTTOM_PAD, GUTTER_W, MIN_EVENT_MIN, PX_PER_MIN, RESOURCE_MIN_W, STEP_MIN, TOP_PAD } from "./constants";
import { clamp, dateAtMinute, dayISO, fullName, layoutOverlaps, minutesFromDayStart, overlaps, parseHHMM, shiftDays, snap } from "./utils";
import type {
  BaseSchedulerResource,
  SchedulerAppointmentAppearance,
  SchedulerAppointmentColorToken,
  SchedulerDragState,
  SchedulerEvent,
  SchedulerId,
  SchedulerProps
} from "../types/scheduler";

function isNameLike(resource: unknown): resource is { firstName?: string | null; lastName?: string | null } {
  if (!resource || typeof resource !== "object") {
    return false;
  }
  const maybe = resource as { firstName?: unknown; lastName?: unknown };
  return typeof maybe.firstName === "string" || typeof maybe.lastName === "string";
}

function toInputDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromInputDateValue(value: string): Date | null {
  const [yearRaw, monthRaw, dayRaw] = value.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  return new Date(year, month - 1, day);
}

const DEFAULT_APPOINTMENT_COLOR_TOKEN_CLASS_MAP: Record<SchedulerAppointmentColorToken, string> = {
  slate: "bg-slate-100 dark:bg-slate-900/40",
  gray: "bg-gray-100 dark:bg-gray-900/40",
  zinc: "bg-zinc-100 dark:bg-zinc-900/40",
  neutral: "bg-neutral-100 dark:bg-neutral-900/40",
  stone: "bg-stone-100 dark:bg-stone-900/40",
  red: "bg-red-100 dark:bg-red-950/40",
  orange: "bg-orange-100 dark:bg-orange-950/40",
  amber: "bg-amber-100 dark:bg-amber-950/40",
  yellow: "bg-yellow-100 dark:bg-yellow-950/40",
  lime: "bg-lime-100 dark:bg-lime-950/40",
  green: "bg-green-100 dark:bg-green-950/40",
  emerald: "bg-emerald-100 dark:bg-emerald-950/40",
  teal: "bg-teal-100 dark:bg-teal-950/40",
  cyan: "bg-cyan-100 dark:bg-cyan-950/40",
  sky: "bg-sky-100 dark:bg-sky-950/40",
  blue: "bg-blue-100 dark:bg-blue-950/40",
  indigo: "bg-indigo-100 dark:bg-indigo-950/40",
  violet: "bg-violet-100 dark:bg-violet-950/40",
  purple: "bg-purple-100 dark:bg-purple-950/40",
  fuchsia: "bg-fuchsia-100 dark:bg-fuchsia-950/40",
  pink: "bg-pink-100 dark:bg-pink-950/40",
  rose: "bg-rose-100 dark:bg-rose-950/40"
};

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
  renderDatePicker,
  prevButtonLabel = "Prev",
  nextButtonLabel = "Next",
  dayStart = "09:00",
  dayEnd = "18:00"
}: SchedulerProps<TAppointment, TResource, TResourceId>) {
  const [drag, setDrag] = React.useState<SchedulerDragState<TResourceId>>({ kind: "none" });
  const colRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const suppressClickRef = React.useRef(false);

  const dayStartAbs = parseHHMM(dayStart);
  const dayEndAbs = parseHHMM(dayEnd);
  const dayMinutes = Math.max(0, dayEndAbs - dayStartAbs);
  const gridHeight = TOP_PAD + dayMinutes * PX_PER_MIN + BOTTOM_PAD;
  const gridMinWidth = GUTTER_W + Math.max(resources.length, 1) * RESOURCE_MIN_W;
  const selectedISO = React.useMemo(() => dayISO(selectedDate), [selectedDate]);

  const renderAppts = React.useMemo<SchedulerEvent<TAppointment, TResourceId>[]>(() => {
    return appointments
      .map((appointment) => {
        const start = new Date(adapter.getStart(appointment));
        const end = new Date(adapter.getEnd(appointment));
        return {
          raw: appointment,
          id: adapter.getId(appointment),
          resourceId: adapter.getResourceId(appointment),
          start,
          end,
          startMin: clamp(minutesFromDayStart(dayStartAbs, start), 0, dayMinutes),
          endMin: clamp(minutesFromDayStart(dayStartAbs, end), 0, dayMinutes),
          title: adapter.getTitle(appointment)
        };
      })
      .filter((appointment) => dayISO(appointment.start) === selectedISO);
  }, [appointments, adapter, dayStartAbs, dayMinutes, selectedISO]);

  const appointmentMap = React.useMemo(() => {
    return new Map(renderAppts.map((appointment) => [appointment.id, appointment]));
  }, [renderAppts]);

  const effectiveAppts = React.useMemo<SchedulerEvent<TAppointment, TResourceId>[]>(() => {
    if (drag.kind === "none") {
      return renderAppts;
    }
    return renderAppts.map((appointment) => {
      if (appointment.id !== drag.appointmentId) {
        return appointment;
      }
      return {
        ...appointment,
        resourceId: drag.resourceId,
        startMin: drag.startMin,
        endMin: drag.endMin,
        start: dateAtMinute(selectedDate, dayStartAbs, drag.startMin),
        end: dateAtMinute(selectedDate, dayStartAbs, drag.endMin)
      };
    });
  }, [drag, renderAppts, selectedDate, dayStartAbs]);

  const laidOutByResource = React.useMemo(() => {
    const byResource = new Map<TResourceId, ReturnType<typeof layoutOverlaps<SchedulerEvent<TAppointment, TResourceId>>>>();
    for (const resource of resources) {
      const events = effectiveAppts.filter((appointment) => appointment.resourceId === resource.id);
      byResource.set(resource.id, layoutOverlaps(events));
    }
    return byResource;
  }, [effectiveAppts, resources]);

  const appointmentBgByResource = React.useMemo(() => {
    const map = new Map<TResourceId, string | undefined>();
    if (!getResourceAppointmentBackground) {
      return map;
    }
    for (const resource of resources) {
      map.set(resource.id, getResourceAppointmentBackground(resource));
    }
    return map;
  }, [getResourceAppointmentBackground, resources]);

  const appointmentColorTokenClassByResource = React.useMemo(() => {
    const map = new Map<TResourceId, string | undefined>();
    const mergedClassMap = {
      ...DEFAULT_APPOINTMENT_COLOR_TOKEN_CLASS_MAP,
      ...(appointmentColorTokenClassMap ?? {})
    };
    if (!getResourceAppointmentColorToken) {
      return map;
    }
    for (const resource of resources) {
      const token = getResourceAppointmentColorToken(resource);
      map.set(resource.id, token ? mergedClassMap[token] : undefined);
    }
    return map;
  }, [appointmentColorTokenClassMap, getResourceAppointmentColorToken, resources]);

  const appointmentAppearanceByResource = React.useMemo(() => {
    const map = new Map<TResourceId, SchedulerAppointmentAppearance | undefined>();
    for (const resource of resources) {
      const classFromIdMap = resourceAppointmentClassMap?.[String(resource.id)];
      if (classFromIdMap) {
        map.set(resource.id, { className: classFromIdMap });
        continue;
      }
      const appearance = getResourceAppointmentAppearance?.(resource);
      if (appearance) {
        map.set(resource.id, appearance);
        continue;
      }
      const tokenClass = appointmentColorTokenClassByResource.get(resource.id);
      if (tokenClass) {
        map.set(resource.id, { className: tokenClass });
        continue;
      }
      const legacyBackground = appointmentBgByResource.get(resource.id);
      if (!legacyBackground) {
        map.set(resource.id, undefined);
        continue;
      }
      map.set(resource.id, { className: legacyBackground });
    }
    return map;
  }, [appointmentBgByResource, appointmentColorTokenClassByResource, getResourceAppointmentAppearance, resourceAppointmentClassMap, resources]);

  const pointerToMin = (resourceId: TResourceId, clientY: number) => {
    const col = colRefs.current[String(resourceId)];
    if (!col) {
      return 0;
    }
    const y = clientY - col.getBoundingClientRect().top - TOP_PAD;
    return clamp(snap(y / PX_PER_MIN), 0, dayMinutes);
  };

  const pointerToResourceId = (clientX: number, fallbackResourceId: TResourceId) => {
    for (const resource of resources) {
      const col = colRefs.current[String(resource.id)];
      if (!col) {
        continue;
      }
      const rect = col.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) {
        return resource.id;
      }
    }
    return fallbackResourceId;
  };

  const hasOverlap = (appointmentId: SchedulerId, resourceId: TResourceId, startMin: number, endMin: number) => {
    const events = renderAppts.filter((appointment) => appointment.resourceId === resourceId && appointment.id !== appointmentId);
    return events.some((appointment) => overlaps(appointment, { id: appointmentId, startMin, endMin }));
  };

  const persistDrag = async (state: Exclude<SchedulerDragState<TResourceId>, { kind: "none" }>) => {
    const target = appointmentMap.get(state.appointmentId);
    if (!target) {
      return;
    }
    if (hasOverlap(state.appointmentId, state.resourceId, state.startMin, state.endMin)) {
      return;
    }
    const next = {
      resourceId: state.resourceId,
      start: dateAtMinute(selectedDate, dayStartAbs, state.startMin),
      end: dateAtMinute(selectedDate, dayStartAbs, state.endMin)
    };

    if (onAppointmentChange) {
      await onAppointmentChange({
        kind: state.kind,
        appointment: target.raw,
        previous: {
          resourceId: target.resourceId,
          start: target.start,
          end: target.end
        },
        next
      });
      return;
    }

    if (onPersistMoveResize) {
      await onPersistMoveResize({
        appointment: target.raw,
        resourceId: next.resourceId,
        start: next.start,
        end: next.end
      });
    }
  };

  const onApptPointerDown = (event: React.PointerEvent, appointment: SchedulerEvent<TAppointment, TResourceId>) => {
    if (event.button !== 0) {
      return;
    }
    event.stopPropagation();
    suppressClickRef.current = false;
    const pointerMin = pointerToMin(appointment.resourceId, event.clientY);
    setDrag({
      kind: "move",
      appointmentId: appointment.id,
      pointerId: event.pointerId,
      resourceId: appointment.resourceId,
      durationMin: Math.max(MIN_EVENT_MIN, appointment.endMin - appointment.startMin),
      offsetMin: pointerMin - appointment.startMin,
      startMin: appointment.startMin,
      endMin: appointment.endMin
    });
  };

  const onResizePointerDown = (event: React.PointerEvent, appointment: SchedulerEvent<TAppointment, TResourceId>) => {
    if (event.button !== 0) {
      return;
    }
    event.stopPropagation();
    suppressClickRef.current = false;
    setDrag({
      kind: "resize",
      appointmentId: appointment.id,
      pointerId: event.pointerId,
      resourceId: appointment.resourceId,
      startMin: appointment.startMin,
      endMin: appointment.endMin
    });
  };

  const onGlobalPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (drag.kind === "none") {
      return;
    }

    if (drag.kind === "move") {
      const nextResourceId = pointerToResourceId(event.clientX, drag.resourceId);
      const pointerMin = pointerToMin(nextResourceId, event.clientY);
      const rawStart = pointerMin - drag.offsetMin;
      const nextStartMin = clamp(snap(rawStart), 0, dayMinutes - drag.durationMin);
      const nextEndMin = nextStartMin + drag.durationMin;
      if (nextStartMin !== drag.startMin || nextEndMin !== drag.endMin || nextResourceId !== drag.resourceId) {
        suppressClickRef.current = true;
        setDrag({
          ...drag,
          resourceId: nextResourceId,
          startMin: nextStartMin,
          endMin: nextEndMin
        });
      }
      return;
    }

    const pointerMin = pointerToMin(drag.resourceId, event.clientY);
    const nextEndMin = clamp(snap(pointerMin), drag.startMin + MIN_EVENT_MIN, dayMinutes);
    if (nextEndMin !== drag.endMin) {
      suppressClickRef.current = true;
      setDrag({
        ...drag,
        endMin: nextEndMin
      });
    }
  };

  const onGlobalPointerUp = () => {
    if (drag.kind === "none") {
      return;
    }
    const current = drag;
    setDrag({ kind: "none" });
    if (suppressClickRef.current) {
      void persistDrag(current);
    }
  };

  const defaultRenderAppointment = ({
    appointment,
    onPointerDown,
    onResizePointerDown,
    appointmentAppearance,
    appointmentBackgroundColor
  }: {
    appointment: SchedulerEvent<TAppointment, TResourceId> & { lane: number; lanes: number };
    onPointerDown: (e: React.PointerEvent) => void;
    onResizePointerDown: (e: React.PointerEvent) => void;
    appointmentAppearance?: SchedulerAppointmentAppearance;
    appointmentBackgroundColor?: string;
    drag: SchedulerDragState<TResourceId>;
    suppressClickRef: React.RefObject<boolean>;
  }) => {
    const rawMaybe = appointment.raw as { description?: unknown };
    const description = typeof rawMaybe.description === "string" ? rawMaybe.description : undefined;
    const legacyClassName = typeof appointmentBackgroundColor === "string" ? appointmentBackgroundColor : undefined;
    const backgroundClassName = appointmentAppearance?.className ?? legacyClassName ?? "bg-muted/40 dark:bg-muted/30";
    const className = `relative h-full cursor-grab overflow-hidden rounded-md border border-border p-2 pb-5 text-foreground ${backgroundClassName}`;

    return (
      <div onPointerDown={onPointerDown} className={className}>
        <div className="text-xs font-semibold">{appointment.title}</div>
        {description ? <div className="mt-1 text-[10px] font-medium text-muted-foreground">{description}</div> : null}
        <div
          role="button"
          aria-label="Resize appointment"
          onPointerDown={(event) => {
            event.stopPropagation();
            onResizePointerDown(event);
          }}
          className="absolute inset-x-1 bottom-1 h-2 cursor-ns-resize rounded-full bg-border/90 transition-colors hover:bg-border"
        />
      </div>
    );
  };

  const defaultRenderDatePicker = ({
    selectedDate: value,
    onSelectedDateChange: onDateChange
  }: {
    selectedDate: Date;
    onSelectedDateChange: (date: Date) => void;
  }) => (
    <input
      type="date"
      value={toInputDateValue(value)}
      onChange={(event) => {
        const nextDate = fromInputDateValue(event.target.value);
        if (nextDate) {
          onDateChange(nextDate);
        }
      }}
      className="h-7 rounded-md border border-border bg-card px-2 text-xs text-foreground"
      aria-label="Select date"
    />
  );

  const defaultRenderResourceHeader = (resource: TResource) => <strong>{resource.label}</strong>;

  return (
    <section
      className={`rfs-root rounded-lg bg-background text-foreground ${drag.kind === "move" ? "rfs-root--drag-move" : ""} ${drag.kind === "resize" ? "rfs-root--drag-resize" : ""}`}
      onPointerMove={onGlobalPointerMove}
      onPointerUp={onGlobalPointerUp}
      onPointerCancel={onGlobalPointerUp}
    >
      <div className="rfs-toolbar">
        <button
          className="rfs-btn border-border bg-card text-foreground hover:bg-muted"
          type="button"
          onClick={() => onSelectedDateChange(shiftDays(selectedDate, -1))}
        >
          {prevButtonLabel}
        </button>
        {(renderDatePicker ?? defaultRenderDatePicker)({ selectedDate, onSelectedDateChange })}
        <button
          className="rfs-btn border-border bg-card text-foreground hover:bg-muted"
          type="button"
          onClick={() => onSelectedDateChange(shiftDays(selectedDate, 1))}
        >
          {nextButtonLabel}
        </button>
      </div>

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
                {(renderResourceHeader ?? defaultRenderResourceHeader)(resource)}
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
