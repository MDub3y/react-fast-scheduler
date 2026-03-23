import React, { RefObject } from "react";

export type SchedulerAppointmentAdapter<TAppointment, TResourceId extends string | number> = {
  getId: (item: TAppointment) => number | string;
  getResourceId: (item: TAppointment) => TResourceId;
  getStart: (item: TAppointment) => Date | string;
  getEnd: (item: TAppointment) => Date | string;
  getTitle: (item: TAppointment) => string;
};

export type SchedulerId = string | number;

export type BaseSchedulerResource<TId extends SchedulerId = number> = {
  id: TId;
  label: string;
};

export type SchedulerEvent<TAppointment, TResourceId extends SchedulerId> = {
  raw: TAppointment;
  id: SchedulerId;
  resourceId: TResourceId;
  start: Date;
  end: Date;
  startMin: number;
  endMin: number;
  title: string;
};

export type SchedulerDragState<TResourceId extends SchedulerId> =
  | { kind: "none" }
  | {
      kind: "move";
      appointmentId: SchedulerId;
      pointerId: number;
      resourceId: TResourceId;
      offsetMin: number;
      durationMin: number;
      startMin: number;
      endMin: number;
    }
  | {
      kind: "resize";
      appointmentId: SchedulerId;
      pointerId: number;
      resourceId: TResourceId;
      startMin: number;
      endMin: number;
    };

export type RenderSchedulerAppt<TAppointment, TResourceId extends SchedulerId> = SchedulerEvent<TAppointment, TResourceId>;

export type SchedulerAppointmentChangeArgs<TAppointment, TResourceId extends SchedulerId> = {
  kind: "move" | "resize";
  appointment: TAppointment;
  previous: {
    resourceId: TResourceId;
    start: Date;
    end: Date;
  };
  next: {
    resourceId: TResourceId;
    start: Date;
    end: Date;
  };
};

export type SchedulerAppointmentAppearance = {
  className?: string;
};

export type SchedulerAppointmentColorToken = string;
export type SchedulerResourceClassMap = Partial<Record<string, string>>;
export type SchedulerToolbarRenderArgs = {
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  defaultDatePicker: React.ReactNode;
};

export type SchedulerProps<
  TAppointment,
  TResource extends BaseSchedulerResource<TResourceId>,
  TResourceId extends SchedulerId
> = {
  resources: TResource[];
  appointments: TAppointment[];
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
  adapter: SchedulerAppointmentAdapter<TAppointment, TResourceId>;
  onPersistMoveResize?: (args: {
    appointment: TAppointment;
    resourceId: TResourceId;
    start: Date;
    end: Date;
  }) => Promise<void> | void;
  onAppointmentChange?: (args: SchedulerAppointmentChangeArgs<TAppointment, TResourceId>) => Promise<void> | void;
  renderResourceHeader?: (resource: TResource) => React.ReactNode;
  renderAppointment?: (args: {
    appointment: SchedulerEvent<TAppointment, TResourceId> & { lane: number; lanes: number };
    onPointerDown: (e: React.PointerEvent) => void;
    onResizePointerDown: (e: React.PointerEvent) => void;
    appointmentAppearance?: SchedulerAppointmentAppearance;
    appointmentBackgroundColor?: string;
    drag: SchedulerDragState<TResourceId>;
    suppressClickRef: RefObject<boolean>;
  }) => React.ReactNode;
  resourceAppointmentClassMap?: SchedulerResourceClassMap;
  getResourceAppointmentAppearance?: (resource: TResource) => SchedulerAppointmentAppearance | undefined;
  getResourceAppointmentColorToken?: (resource: TResource) => SchedulerAppointmentColorToken | undefined;
  appointmentColorTokenClassMap?: Record<SchedulerAppointmentColorToken, string>;
  getResourceAppointmentBackground?: (resource: TResource) => string | undefined;
  renderToolbar?: (args: SchedulerToolbarRenderArgs) => React.ReactNode;
  renderDatePicker?: (args: {
    selectedDate: Date;
    onSelectedDateChange: (date: Date) => void;
  }) => React.ReactNode;
  prevButtonLabel?: React.ReactNode;
  nextButtonLabel?: React.ReactNode;
  dayStart?: string;
  dayEnd?: string;
};
