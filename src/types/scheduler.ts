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
  onAppointmentChange?: (args: {
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
  }) => Promise<void> | void;
  renderResourceHeader: (resource: TResource) => React.ReactNode;
  renderAppointment: (args: {
    appointment: SchedulerEvent<TAppointment, TResourceId> & { lane: number; lanes: number };
    onPointerDown: (e: React.PointerEvent) => void;
    onResizePointerDown: (e: React.PointerEvent) => void;
    appointmentBackgroundColor?: string;
    drag: SchedulerDragState<TResourceId>;
    suppressClickRef: RefObject<boolean>;
  }) => React.ReactNode;
  getResourceAppointmentBackground?: (resource: TResource) => string | undefined;
  renderDatePicker?: (args: {
    selectedDate: Date;
    onSelectedDateChange: (date: Date) => void;
  }) => React.ReactNode;
  prevButtonLabel?: React.ReactNode;
  nextButtonLabel?: React.ReactNode;
  dayStart?: string;
  dayEnd?: string;
};
