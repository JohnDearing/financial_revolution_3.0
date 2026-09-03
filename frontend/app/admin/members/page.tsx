"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type MemberRow = {
  id: string;
  fullName: string;
  email: string;
  isEmailVerified: boolean;
  enrollmentPaid: boolean;
  membershipStatus: string;
  planName: string;
  planPrice: string;
};

type MembersPageResponse = {
  message?: string;
  members?: MemberRow[];
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
};

const PAGE_SIZE = 10;

function visiblePages(current: number, total: number): number[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const start = Math.max(1, Math.min(current - 2, total - 4));
  const end = Math.min(total, start + 4);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadMembers = async (nextPage: number) => {
    setLoading(true);
    const response = await fetch(
      `/api/admin/members?page=${nextPage}&pageSize=${PAGE_SIZE}`,
    );
    const result = (await response.json()) as MembersPageResponse;

    if (!response.ok) {
      toast.error(result.message ?? "Unable to load members.");
      setLoading(false);
      return;
    }

    setMembers(result.members ?? []);
    setPage(result.page ?? nextPage);
    setTotal(result.total ?? 0);
    setTotalPages(result.totalPages ?? 1);
    setLoading(false);
  };

  useEffect(() => {
    void loadMembers(1);
  }, []);

  const canGoPrev = page > 1 && !loading;
  const canGoNext = page < totalPages && !loading;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = (page - 1) * PAGE_SIZE + members.length;

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 md:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Member Management</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Live membership records from your Financial Revolution database.
          </p>
        </div>
        {!loading && total > 0 ? (
          <p className="text-xs text-zinc-500">
            Showing {rangeStart}–{rangeEnd} of {total}
          </p>
        ) : null}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="min-w-[720px] w-full text-left text-sm">
          <thead className="bg-background text-zinc-400">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Verification</th>
              <th className="px-3 py-2 font-medium">Enrollment</th>
              <th className="px-3 py-2 font-medium">Membership</th>
              <th className="px-3 py-2 font-medium">Plan</th>
            </tr>
          </thead>
          <tbody className="text-zinc-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-zinc-500">
                  Loading members...
                </td>
              </tr>
            ) : null}
            {!loading && members.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-zinc-500">
                  No members found.
                </td>
              </tr>
            ) : null}
            {!loading
              ? members.map((member) => (
                  <tr key={member.id} className="border-t border-border">
                    <td className="px-3 py-2">{member.fullName}</td>
                    <td className="px-3 py-2 text-zinc-400">{member.email}</td>
                    <td className="px-3 py-2 text-gold">
                      {member.isEmailVerified ? "Verified" : "Pending"}
                    </td>
                    <td className="px-3 py-2">
                      {member.enrollmentPaid ? "Paid" : "Unpaid"}
                    </td>
                    <td className="px-3 py-2 uppercase text-gold">
                      {member.membershipStatus}
                    </td>
                    <td className="px-3 py-2">{member.planPrice}/mo</td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>

      {total > 0 ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={() => {
                void loadMembers(page - 1);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-zinc-200 transition hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-zinc-200"
            >
              <ChevronLeft size={14} aria-hidden="true" />
              Previous
            </button>
            <div className="flex items-center gap-1">
              {visiblePages(page, totalPages).map((pageNumber) => {
                const isActive = pageNumber === page;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      void loadMembers(pageNumber);
                    }}
                    className={`h-9 min-w-9 rounded-lg border px-2 text-sm transition ${
                      isActive
                        ? "border-gold/40 bg-gold/10 text-gold"
                        : "border-border text-zinc-300 hover:border-gold/40 hover:text-gold"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              disabled={!canGoNext}
              onClick={() => {
                void loadMembers(page + 1);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-zinc-200 transition hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-zinc-200"
            >
              Next
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
