export type CurriculumModule = {
  id: string;
  trackId: string;
  title: string;
};

export type CurriculumTrack = {
  id: string;
  title: string;
  focus: string;
  moduleIds: string[];
};

export const CURRICULUM_MODULES: CurriculumModule[] = [
  { id: "f1", trackId: "foundation", title: "Money Mindset Reset" },
  { id: "f2", trackId: "foundation", title: "Cashflow Mapping" },
  { id: "f3", trackId: "foundation", title: "Budget Systems That Stick" },
  { id: "f4", trackId: "foundation", title: "Emergency Fund Framework" },
  { id: "f5", trackId: "foundation", title: "Debt Attack Plan" },
  { id: "f6", trackId: "foundation", title: "Weekly Money Review" },
  { id: "m1", trackId: "money-zone", title: "Chart Structure Basics" },
  { id: "m2", trackId: "money-zone", title: "Level Markup Practice" },
  { id: "m3", trackId: "money-zone", title: "Invalidation Rules" },
  { id: "m4", trackId: "money-zone", title: "Execution Checklist" },
  { id: "m5", trackId: "money-zone", title: "Live Lab Replay Review" },
  { id: "d1", trackId: "diversification", title: "Income Stream Map" },
  { id: "d2", trackId: "diversification", title: "Risk Allocation Basics" },
  { id: "d3", trackId: "diversification", title: "Portfolio Balance Lab" },
  { id: "d4", trackId: "diversification", title: "Drawdown Playbook" },
  { id: "w1", trackId: "wealth", title: "Compounding Habits" },
  { id: "w2", trackId: "wealth", title: "Legacy Planning Intro" },
  { id: "w3", trackId: "wealth", title: "Long-Term Wealth Review" },
];

export const CURRICULUM_TRACKS: CurriculumTrack[] = [
  {
    id: "foundation",
    title: "Foundation Track",
    focus: "Budgeting, cashflow discipline, and money systems that stick.",
    moduleIds: ["f1", "f2", "f3", "f4", "f5", "f6"],
  },
  {
    id: "money-zone",
    title: "Money Zone",
    focus: "Chart markup, execution readiness, and live market application.",
    moduleIds: ["m1", "m2", "m3", "m4", "m5"],
  },
  {
    id: "diversification",
    title: "Intelligent Diversification",
    focus: "Multiple income streams, risk management, and allocation strategy.",
    moduleIds: ["d1", "d2", "d3", "d4"],
  },
  {
    id: "wealth",
    title: "Wealth & Legacy",
    focus: "Long-term growth frameworks, mentorship habits, and compounding.",
    moduleIds: ["w1", "w2", "w3"],
  },
];

export type LiveSession = {
  day: "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
  dayLabel: string;
  title: string;
  /** Short time for compact UI badges (primary timezone). */
  time: string;
  /** Full client timezone line shown in the schedule. */
  timeZones: string;
  type: string;
  /** True when the day has no live session. */
  isOff?: boolean;
};

/** Official client weekly live-class schedule (PST / CST / EST). */
export const LIVE_SESSIONS: LiveSession[] = [
  {
    day: "Sun",
    dayLabel: "Sunday",
    title: "The Money $$$ Zone",
    time: "7:00 PM PST",
    timeZones: "7pm PST / 9pm CST / 10pm EST",
    type: "Live Class",
  },
  {
    day: "Sun",
    dayLabel: "Sunday",
    title: "Intelligent Diversification",
    time: "5:00 PM PST",
    timeZones: "5pm PST / 7pm CST / 8pm EST",
    type: "Live Class",
  },
  {
    day: "Mon",
    dayLabel: "Monday",
    title: "Basics Of Forex",
    time: "7:00 PM PST",
    timeZones: "7pm PST / 9pm CST / 10pm EST",
    type: "Live Class",
  },
  {
    day: "Tue",
    dayLabel: "Tuesday",
    title: "Market Structure and Patterns",
    time: "7:00 PM PST",
    timeZones: "7pm PST / 9pm CST / 10pm EST",
    type: "Live Class",
  },
  {
    day: "Tue",
    dayLabel: "Tuesday",
    title: "Step 2 Training",
    time: "7:00 PM PST",
    timeZones: "7pm PST / 9pm CST / 10pm EST",
    type: "Training",
  },
  {
    day: "Wed",
    dayLabel: "Wednesday",
    title: "No Class",
    time: "—",
    timeZones: "",
    type: "Off",
    isOff: true,
  },
  {
    day: "Thu",
    dayLabel: "Thursday",
    title: "Checklist",
    time: "7:00 PM PST",
    timeZones: "7pm PST / 9pm CST / 10pm EST",
    type: "Live Class",
  },
];

export const WORKSHOP_REPLAYS = [
  {
    title: "Reading Price Action with Confidence",
    duration: "48 min",
    track: "Money Zone",
    date: "2026-07-14",
  },
  {
    title: "Building Your First Allocation Plan",
    duration: "36 min",
    track: "Diversification",
    date: "2026-07-11",
  },
  {
    title: "Discipline Systems That Compound",
    duration: "41 min",
    track: "Foundation",
    date: "2026-07-09",
  },
] as const;

export const TOTAL_MODULES = CURRICULUM_MODULES.length;

/** Map admin ContentItem.track labels onto curriculum track ids. */
export function resolveTrackId(track: string | null | undefined): string {
  const value = (track ?? "").trim().toLowerCase();
  if (!value) return "foundation";
  if (value.includes("foundation")) return "foundation";
  if (value.includes("money")) return "money-zone";
  if (value.includes("diversif")) return "diversification";
  if (value.includes("wealth") || value.includes("legacy")) return "wealth";
  return "foundation";
}

export function formatDurationLabel(durationSec: number | null | undefined) {
  if (!durationSec || durationSec <= 0) return "—";
  const minutes = Math.max(1, Math.round(durationSec / 60));
  return `${minutes} min`;
}

export function getNextLiveSession(from = new Date()) {
  const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(from);
    date.setDate(from.getDate() + offset);
    const day = dayMap[date.getDay()];
    const session = LIVE_SESSIONS.find((item) => item.day === day && !item.isOff);
    if (session) {
      return {
        ...session,
        startsOn: date.toISOString().slice(0, 10),
        label: `${session.day}, ${session.time}`,
      };
    }
  }
  return null;
}
