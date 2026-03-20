# react-fast-scheduler

A lightweight React scheduling library scaffold with CI/CD publishing.

## Install

```bash
npm i @marco.colia/react-fast-scheduler
```

## Usage

```tsx
import { useState } from "react";
import { Scheduler } from "@marco.colia/react-fast-scheduler";
import "@marco.colia/react-fast-scheduler/styles.css";
import type { BaseSchedulerResource } from "@marco.colia/react-fast-scheduler";

type Staff = BaseSchedulerResource<number> & {
  firstName: string;
  lastName: string;
  appointmentColorClass?: string;
};

type Appointment = {
  id: number;
  staffId: number;
  description?: string;
  customerName: string;
  title: string;
  start: string; // ISO string
  end: string; // ISO string
};

const initialStaff: Staff[] = [
  { id: 1, label: "Room A", firstName: "Anna", lastName: "Rossi", appointmentColorClass: "bg-amber-100" },
  { id: 2, label: "Room B", firstName: "Luca", lastName: "Bianchi", appointmentColorClass: "bg-blue-100" }
];

const initialAppointments: Appointment[] = [
  {
    id: 100,
    staffId: 1,
    description: "First consultation",
    customerName: "Mario Rossi",
    title: "Consultation",
    start: "2026-03-20T09:00:00.000Z",
    end: "2026-03-20T09:30:00.000Z"
  }
];

export function SchedulerExample() {
  const [selectedDate, setSelectedDate] = useState(new Date("2026-03-20T00:00:00.000Z"));
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);

  return (
    <Scheduler<Appointment, Staff, number>
      resources={initialStaff}
      appointments={appointments}
      selectedDate={selectedDate}
      onSelectedDateChange={setSelectedDate}
      prevButtonLabel="Previous day"
      nextButtonLabel="Next day"
      adapter={{
        getId: (a) => a.id,
        getResourceId: (a) => a.staffId,
        getStart: (a) => a.start,
        getEnd: (a) => a.end,
        getTitle: (a) => `${a.customerName} - ${a.title}`
      }}
      renderDatePicker={({ selectedDate: value, onSelectedDateChange }) => (
        <input
          type="date"
          value={value.toISOString().slice(0, 10)}
          onChange={(event) => onSelectedDateChange(new Date(`${event.target.value}T00:00:00`))}
        />
      )}
      onAppointmentChange={async ({ appointment, next }) => {
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === appointment.id
              ? { ...a, staffId: next.resourceId, start: next.start.toISOString(), end: next.end.toISOString() }
              : a
          )
        );
      }}
      getResourceAppointmentBackground={(resource) => resource.appointmentColorClass}
      renderResourceHeader={(resource) => <strong>{resource.label}</strong>}
      renderAppointment={({ appointment, onPointerDown, onResizePointerDown, appointmentBackgroundColor }) => (
        <div
          onPointerDown={onPointerDown}
          className={`relative h-full cursor-grab overflow-hidden rounded-md border border-slate-300 p-2 pb-5 ${appointmentBackgroundColor ?? "bg-slate-100"}`}
        >
          <div className="text-xs font-semibold">{appointment.title}</div>
          {appointment.raw.description ? (
            <div className="mt-1 text-[10px] font-medium text-slate-500">
              {appointment.raw.description}
            </div>
          ) : null}
          <div
            role="button"
            aria-label="Resize appointment"
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizePointerDown(e);
            }}
            className="absolute inset-x-1 bottom-1 h-2 cursor-ns-resize rounded-full bg-slate-300/90 hover:bg-slate-400"
          />
        </div>
      )}
      dayStart="09:00"
      dayEnd="18:00"
    />
  );
}
```

Main props you need to pass:
- `resources`: your columns (staff, rooms, etc), each with at least `{ id, label }`.
- `appointments`: raw items from your backend.
- `adapter`: functions that map your raw appointment shape to scheduler fields.
- `onAppointmentChange`: optional generic callback fired after move/resize drop.
- `onPersistMoveResize`: optional legacy persistence callback (used if `onAppointmentChange` is not provided).
- `getResourceAppointmentBackground`: optional function to provide appointment background color per resource.
- `prevButtonLabel` and `nextButtonLabel`: custom labels for toolbar navigation buttons.
- `renderDatePicker`: inject your own date picker UI (for example shadcn calendar).
- `renderResourceHeader`, `renderAppointment`: rendering hooks for your UI.

### shadcn Calendar Date Picker

```tsx
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

<Scheduler
  // ...other props
  renderDatePicker={({ selectedDate, onSelectedDateChange }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">{selectedDate.toDateString()}</Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onSelectedDateChange(date)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )}
/>;
```

## Styles

The package ships a precompiled CSS file generated from Tailwind:

```tsx
import "@marco.colia/react-fast-scheduler/styles.css";
```

Minimal app entry example:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { SchedulerExample } from "./SchedulerExample";
import "@marco.colia/react-fast-scheduler/styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(<SchedulerExample />);
```

If you work inside this library repo (local demo), import the Tailwind v4 source entry:

```tsx
import "../src/global.css";
```

You can override tokens in your app:

```css
:root {
  --rfs-bg: #f8fafc;
  --rfs-surface: #ffffff;
  --rfs-border: #e2e8f0;
  --rfs-text: #0f172a;
  --rfs-muted: #64748b;
}
```

## Development

```bash
npm install
npm run dev:demo
npm run lint
npm run test
npm run build
```

`dev/main.tsx` contains a minimal runnable scheduler demo used by `npm run dev:demo`.
Tailwind v4 source styles are in `src/global.css`, and the demo imports them from `dev/main.tsx`.

## Releasing

This repo uses [Changesets](https://github.com/changesets/changesets) and GitHub Actions.

1. Create a changeset: `npx changeset`
2. Merge to `main`
3. The `Release` workflow opens/updates a release PR
4. Merging that PR publishes to npm (via npm Trusted Publishing/OIDC, or `NPM_TOKEN` if configured)
