import type { SchedulerAppointmentChangeArgs, SchedulerId } from "./types";

export type ApplySchedulerAppointmentChangeOptions<TAppointment, TResourceId extends SchedulerId> = {
  getId: (appointment: TAppointment) => SchedulerId;
  setResourceId: (appointment: TAppointment, resourceId: TResourceId) => TAppointment;
  setStart: (appointment: TAppointment, start: Date) => TAppointment;
  setEnd: (appointment: TAppointment, end: Date) => TAppointment;
};

export function applySchedulerAppointmentChange<TAppointment, TResourceId extends SchedulerId>(
  appointments: TAppointment[],
  change: SchedulerAppointmentChangeArgs<TAppointment, TResourceId>,
  options: ApplySchedulerAppointmentChangeOptions<TAppointment, TResourceId>
): TAppointment[] {
  return appointments.map((item) => {
    if (options.getId(item) !== options.getId(change.appointment)) {
      return item;
    }
    const withResource = options.setResourceId(item, change.next.resourceId);
    const withStart = options.setStart(withResource, change.next.start);
    return options.setEnd(withStart, change.next.end);
  });
}
