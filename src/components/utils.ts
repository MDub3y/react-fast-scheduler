import { format } from "date-fns";
import { STEP_MIN } from "./constants";

type NameLike = {
    firstName?: string | null;
    lastName?: string | null;
};

type TimeBlockLike<TId extends string | number = string | number> = {
    id: TId;
    startMin: number;
    endMin: number;
};

type LaidOut<T extends TimeBlockLike> = T & {
    lane: number;
    lanes: number;
};

const clamp = (n: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, n));
};

const snap = (mins: number, stepMin = STEP_MIN) => {
    return Math.round(mins / stepMin) * stepMin;
};

const parseHHMM = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
};

const fullName = <T extends NameLike>(u: T) => {
    return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
};

const dayISO = (d: Date) => {
    return format(d, "yyyy-MM-dd");
};

const shiftDays = (d: Date, delta: number) => {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta);
};

const dateAtMinute = (
    selectedDate: Date,
    dayStartAbs: number,
    minuteFromStart: number
) => {
    const base = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        0,
        0,
        0,
        0
    );
    const abs = dayStartAbs + minuteFromStart;
    const hh = Math.floor(abs / 60);
    const mm = abs % 60;
    base.setHours(hh, mm, 0, 0);
    return base;
};

const minutesFromDayStart = (dayStartAbs: number, dt: Date) => {
    return dt.getHours() * 60 + dt.getMinutes() - dayStartAbs;
};

const overlaps = (a: TimeBlockLike, b: TimeBlockLike) => {
    return a.startMin < b.endMin && b.startMin < a.endMin;
};

const layoutOverlaps = <T extends TimeBlockLike>(blocks: T[]): LaidOut<T>[] => {
    const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

    const groups: T[][] = [];
    let active: T[] = [];
    let current: T[] = [];

    for (const e of sorted) {
        active = active.filter((x) => x.endMin > e.startMin);
        const conflicts = active.some((x) => overlaps(x, e));

        if (!conflicts && current.length > 0) {
            groups.push(current);
            current = [];
        }
        current.push(e);
        active.push(e);
    }
    if (current.length) {
        groups.push(current);
    }

    const out: LaidOut<T>[] = [];

    for (const group of groups) {
        const g = [...group].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
        const laneEnd: number[] = [];
        const laneOf = new Map<T["id"], number>();

        for (const e of g) {
            let placed = false;
            for (let i = 0; i < laneEnd.length; i++) {
                if (laneEnd[i] <= e.startMin) {
                    laneEnd[i] = e.endMin;
                    laneOf.set(e.id, i);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                laneEnd.push(e.endMin);
                laneOf.set(e.id, laneEnd.length - 1);
            }
        }

        const lanes = laneEnd.length;
        for (const e of g) {
            out.push({ ...e, lane: laneOf.get(e.id) ?? 0, lanes });
        }
    }

    return out;
};

export {
    clamp,
    snap,
    parseHHMM,
    fullName,
    dayISO,
    shiftDays,
    dateAtMinute,
    minutesFromDayStart,
    overlaps,
    layoutOverlaps,
};
