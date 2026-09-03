export type PaymentHistoryItem = {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: "paid" | "pending" | "failed" | "refunded";
  method: string;
};

export type PaymentHistoryPage = {
  items: PaymentHistoryItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const PAGE_SIZE = 5;

const paymentHistorySeed: PaymentHistoryItem[] = [
  {
    id: "inv_2026_07_02",
    date: "2026-07-02",
    description: "Pro membership — monthly renewal",
    amount: "$99.00",
    status: "paid",
    method: "Visa •••• 4242",
  },
  {
    id: "inv_2026_06_02",
    date: "2026-06-02",
    description: "Pro membership — monthly renewal",
    amount: "$99.00",
    status: "paid",
    method: "Visa •••• 4242",
  },
  {
    id: "inv_2026_05_02",
    date: "2026-05-02",
    description: "Pro membership — monthly renewal",
    amount: "$99.00",
    status: "paid",
    method: "Visa •••• 4242",
  },
  {
    id: "inv_2026_04_02",
    date: "2026-04-02",
    description: "Pro membership — monthly renewal",
    amount: "$99.00",
    status: "paid",
    method: "Visa •••• 4242",
  },
  {
    id: "inv_2026_03_15",
    date: "2026-03-15",
    description: "Plan change — Starter to Pro",
    amount: "$50.00",
    status: "paid",
    method: "Visa •••• 4242",
  },
  {
    id: "inv_2026_03_02",
    date: "2026-03-02",
    description: "Starter membership — monthly renewal",
    amount: "$49.00",
    status: "paid",
    method: "Visa •••• 4242",
  },
  {
    id: "inv_2026_02_02",
    date: "2026-02-02",
    description: "Starter membership — monthly renewal",
    amount: "$49.00",
    status: "failed",
    method: "Visa •••• 4242",
  },
  {
    id: "inv_2026_02_03",
    date: "2026-02-03",
    description: "Starter membership — payment retry",
    amount: "$49.00",
    status: "paid",
    method: "Visa •••• 4242",
  },
  {
    id: "inv_2026_01_02",
    date: "2026-01-02",
    description: "Starter membership — first month",
    amount: "$49.00",
    status: "paid",
    method: "Visa •••• 4242",
  },
  {
    id: "inv_2025_12_18",
    date: "2025-12-18",
    description: "One-time enrollment fee",
    amount: "$150.00",
    status: "paid",
    method: "Visa •••• 4242",
  },
  {
    id: "inv_2025_12_20",
    date: "2025-12-20",
    description: "Enrollment fee adjustment",
    amount: "-$25.00",
    status: "refunded",
    method: "Visa •••• 4242",
  },
  {
    id: "inv_2026_08_02",
    date: "2026-08-02",
    description: "Pro membership — upcoming charge",
    amount: "$99.00",
    status: "pending",
    method: "Visa •••• 4242",
  },
];

export function getPaymentHistoryPage(pageInput = 1): PaymentHistoryPage {
  const page = Number.isFinite(pageInput) && pageInput > 0 ? Math.floor(pageInput) : 1;
  const sorted = [...paymentHistorySeed].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;

  return {
    items: sorted.slice(start, start + PAGE_SIZE),
    page: currentPage,
    pageSize: PAGE_SIZE,
    total,
    totalPages,
  };
}
