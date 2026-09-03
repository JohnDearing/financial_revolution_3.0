export function createSixDigitCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function planToPrice(planId: "starter" | "pro" | "elite") {
  if (planId === "starter") return "$49";
  if (planId === "pro") return "$99";
  return "$199";
}
