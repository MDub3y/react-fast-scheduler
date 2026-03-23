import * as React from "react";
import {createRoot} from "react-dom/client";
import {Scheduler} from "../src";
import type {BaseSchedulerResource} from "../src";
import {Button} from "../src/components/ui/button";
import {Calendar} from "../src/components/ui/calendar";
import {Popover, PopoverContent, PopoverTrigger} from "../src/components/ui/popover";
import "../src/global.css";
import "./styles.css";

type Resource = BaseSchedulerResource<number> & {
    appointmentColorClass?: string;
};

type Appointment = {
    id: number;
    resourceId: number;
    description?: string;
    title: string;
    start: string;
    end: string;
};

const resources: Resource[] = [
    {id: 1, label: "Room A", appointmentColorClass: "bg-amber-100"},
    {id: 2, label: "Room B", appointmentColorClass: "bg-blue-100"}
];

function App() {
    const [selectedDate, setSelectedDate] = React.useState(new Date());
    const [appointments, setAppointments] = React.useState<Appointment[]>([
        {
            id: 1,
            resourceId: 1,
            description: "First consultation with intake notes",
            title: "Initial Meeting",
            start: "2026-03-23T09:00:00.000Z",
            end: "2026-03-23T10:00:00.000Z"
        },
        {
            id: 2,
            resourceId: 2,
            title: "Initial Meeting 2",
            description: "First consultation with intake notes",
            start: "2026-03-23T09:15:00.000Z",
            end: "2026-03-23T12:00:00.000Z"
        }
    ]);

    return (
        <div className="mx-auto my-6 px-4 font-sans">
            <h1 className="mb-4 text-2xl font-semibold tracking-tight">react-fast-scheduler demo</h1>
            <Scheduler<Appointment, Resource, number>
                resources={resources}
                appointments={appointments}
                selectedDate={selectedDate}
                onSelectedDateChange={setSelectedDate}
                adapter={{
                    getId: (item) => item.id,
                    getResourceId: (item) => item.resourceId,
                    getStart: (item) => item.start,
                    getEnd: (item) => item.end,
                    getTitle: (item) => item.title
                }}
                renderToolbar={({selectedDate: value, onSelectedDateChange, goToPreviousDay, goToNextDay}) => (
                    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="text-sm font-semibold text-foreground">Team schedule</div>
                            <div className="text-xs text-muted-foreground">{value.toDateString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={goToPreviousDay}>
                                Indietro
                            </Button>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="min-w-40 justify-start text-left font-normal">
                                        {value.toDateString()}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-2" align="center">
                                    <Calendar selected={value} onSelect={onSelectedDateChange}/>
                                </PopoverContent>
                            </Popover>
                            <Button variant="outline" size="sm" onClick={goToNextDay}>
                                Avanti
                            </Button>
                        </div>
                    </div>
                )}
                onAppointmentChange={async ({next, appointment}) => {
                    setAppointments((prev) =>
                        prev.map((item) =>
                            item.id === appointment.id
                                ? {
                                    ...item,
                                    resourceId: next.resourceId,
                                    start: next.start.toISOString(),
                                    end: next.end.toISOString()
                                }
                                : item
                        )
                    );
                }}
                getResourceAppointmentBackground={(resource) => resource.appointmentColorClass}
                renderResourceHeader={(resource) => <strong className="text-sm">{resource.label}</strong>}
                renderAppointment={({appointment, onPointerDown, onResizePointerDown, appointmentBackgroundColor}) => (
                    <div
                        onPointerDown={onPointerDown}
                        className={`relative h-full cursor-grab overflow-hidden rounded-md border border-slate-300 p-2 pb-5 shadow-sm active:cursor-grabbing ${appointmentBackgroundColor ?? "bg-white"}`}
                    >
                        <div className="text-xs font-semibold leading-tight">{appointment.title}</div>
                        {appointment.raw.description ? (
                            <div className="mt-1 text-[10px] font-medium tracking-wide text-slate-500">
                                {appointment.raw.description}
                            </div>
                        ) : null}
                        <div
                            role="button"
                            aria-label="Resize appointment"
                            className="absolute inset-x-1 bottom-1 h-2 cursor-ns-resize rounded-full bg-slate-300/90 hover:bg-slate-400"
                            onPointerDown={(event) => {
                                event.stopPropagation();
                                onResizePointerDown(event);
                            }}
                        />
                    </div>
                )}
            />
        </div>
    );
}

createRoot(document.getElementById("root")!).render(<App/>);
