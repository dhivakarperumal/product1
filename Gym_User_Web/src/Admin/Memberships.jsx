import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, Eye, Trash2, Edit3, CreditCard, Bell, BellRing, ShieldCheck } from "lucide-react";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import api from "../api";
import { useAuth } from "../PrivateRouter/AuthContext";
import AdminFilter from "../components/AdminFilter";

const Memberships = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");
  const [adminFilter, setAdminFilter] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const itemsPerPage = 10;

  const isSuperAdmin = user?.role === "super admin";

  const formatDate = (value) => {
    if (!value) return "-";
    return dayjs(value).format("DD/MM/YYYY");
  };

  const normalizeMembership = (row) => {
    const paymentMode = row.paymentMode || row.payment_mode || row.paymentMethod || row.payment_method || "";
    const isEMI = row.isEMI === 1 || row.isEMI === true || (!!row.nextEMIDate || !!row.next_emi_date);
    const paymentType = isEMI ? "EMI" : paymentMode ? paymentMode : row.paymentId ? "Paid" : "Pending";

    return {
      id: row.id || row.membershipId || row.membership_id,
      name:
        row.member_name ||
        row.username ||
        row.userName ||
        row.memberName ||
        row.memberName ||
        "Unknown",
      phone:
        row.member_phone ||
        row.user_mobile ||
        row.user_phone ||
        row.mobile ||
        row.phone ||
        "-",
      planName: row.planName || row.plan_name || row.plan || "Unknown Plan",
      startDate: row.startDate || row.start_date || row.joinDate || row.join_date || null,
      endDate: row.endDate || row.end_date || row.expiryDate || row.expiry_date || null,
      trainerName: row.trainerName || row.trainer_full_name || "Unassigned",
      paymentType,
      nextEMIDate: row.nextEMIDate || row.next_emi_date || null,
      status: row.status || "active",
      createdAt: row.createdAt || row.created_at || null,
      raw: row,
    };
  };

  const fetchMemberships = async (adminUuid = null) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (adminUuid) params.adminUuid = adminUuid;
      const res = await api.get("/memberships", { params });
      const list = Array.isArray(res.data) ? res.data : [];
      const normalized = list.map(normalizeMembership);
      setMemberships(normalized);
    } catch (err) {
      console.error("Failed to fetch memberships", err);
      setError("Unable to load memberships. Please refresh.");
      setMemberships([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberships();
  }, []);

  const handleAdminFilterChange = (adminUuid) => {
    setAdminFilter(adminUuid);
    setCurrentPage(1);
    fetchMemberships(adminUuid);
  };

  const getDaysRemaining = (date) => {
    if (!date) return "-";
    const diff = dayjs(date).startOf("day").diff(dayjs().startOf("day"), "day");
    if (diff < 0) return "Expired";
    if (diff === 0) return "Today";
    return `${diff} days`;
  };

  const getNotificationBadge = (endDate, status) => {
    if (!endDate || status !== "active") return null;
    const diff = dayjs(endDate).startOf("day").diff(dayjs().startOf("day"), "day");
    if (diff <= 5 && diff >= 0) {
      return `Completes in ${diff} day${diff === 1 ? "" : "s"}`;
    }
    if (diff < 0) {
      return "Plan complete";
    }
    return null;
  };

  const filteredMemberships = useMemo(() => {
    return memberships.filter((m) => {
      const query = search.trim().toLowerCase();
      if (query) {
        const matches = [m.name, m.phone, m.planName, m.trainerName]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));
        if (!matches) return false;
      }

      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (paymentTypeFilter !== "all" && m.paymentType.toLowerCase() !== paymentTypeFilter) return false;

      if (dateFilter !== "all") {
        const sourceDate = dayjs(m.createdAt || m.startDate);
        if (!sourceDate.isValid()) return false;
        if (dateFilter === "today" && !sourceDate.isSame(dayjs(), "day")) return false;
        if (dateFilter === "this-week" && !sourceDate.isSame(dayjs(), "week")) return false;
        if (dateFilter === "this-month" && !sourceDate.isSame(dayjs(), "month")) return false;
        if (dateFilter === "custom") {
          if (!customStart || !customEnd) return false;
          const start = dayjs(customStart);
          const end = dayjs(customEnd).endOf("day");
          if (!sourceDate.isBetween(start, end, null, "[]")) return false;
        }
      }

      return true;
    });
  }, [memberships, search, statusFilter, paymentTypeFilter, dateFilter, customStart, customEnd]);

  const totalPages = Math.max(1, Math.ceil(filteredMemberships.length / itemsPerPage));
  const paginatedMemberships = filteredMemberships.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, paymentTypeFilter, dateFilter, customStart, customEnd]);

  const exportToExcel = () => {
    const rows = filteredMemberships.map((m, index) => ({
      "S.No": index + 1,
      Name: m.name,
      Phone: m.phone,
      "Plan Name": m.planName,
      "Start Date": formatDate(m.startDate),
      "End Date": formatDate(m.endDate),
      "Days Remaining": getDaysRemaining(m.endDate),
      Trainer: m.trainerName,
      "Payment Type": m.paymentType,
      "Next EMI Date": formatDate(m.nextEMIDate),
      Status: m.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Memberships");
    XLSX.writeFile(workbook, "memberships.xlsx");
  };

  const [popupOpen, setPopupOpen] = useState(false);
  const [popupData, setPopupData] = useState(null);

  const showMembershipPopup = (m) => {
    setPopupData(m);
    setPopupOpen(true);
  };

  const handleDelete = async (membershipId) => {
    if (!window.confirm("Delete this membership? This cannot be undone.")) return;
    try {
      await api.delete(`/memberships/${membershipId}`);
      setMemberships((prev) => prev.filter((m) => m.id !== membershipId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete membership");
    }
  };


  const handleStatusUpdate = async (membershipId, nextStatus) => {
    try {
      await api.put(`/memberships/${membershipId}`, { status: nextStatus });
      setMemberships((prev) =>
        prev.map((m) => (m.id === membershipId ? { ...m, status: nextStatus } : m))
      );
      // update selected membership removed — using popup view instead
    } catch (err) {
      console.error(err);
      alert("Failed to update membership status");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center py-20 px-4 text-white">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="mt-4 text-sm text-white/60">Loading memberships…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {popupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setPopupOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 p-6 text-white shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Selected Membership</p>
                <h2 className="mt-2 text-2xl font-semibold">{popupData?.name || '-'}</h2>
              </div>
              <button onClick={() => setPopupOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-300">
              <p><span className="font-semibold text-white">Plan:</span> {popupData?.planName || '-'}</p>
              <p><span className="font-semibold text-white">Phone:</span> {popupData?.phone || '-'}</p>
              <p><span className="font-semibold text-white">Trainer:</span> {popupData?.trainerName || '-'}</p>
              <p><span className="font-semibold text-white">Status:</span> {popupData?.status || '-'}</p>
              <p><span className="font-semibold text-white">Payment:</span> {popupData?.paymentType || '-'}</p>
              <p><span className="font-semibold text-white">Starts:</span> {popupData?.startDate ? dayjs(popupData.startDate).format('DD/MM/YYYY') : '-'}</p>
              <p><span className="font-semibold text-white">Ends:</span> {popupData?.endDate ? dayjs(popupData.endDate).format('DD/MM/YYYY') : '-'}</p>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={() => setPopupOpen(false)} className="rounded-full bg-orange-500 px-4 py-2 text-white">Close</button>
            </div>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.26em] text-orange-400/80">Admin Dashboard</p>
            <h1 className="mt-3 text-4xl font-bold text-white">Memberships</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Manage all memberships, see plan status, EMI schedule and trainer assignments from a single admin view.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={exportToExcel}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200 transition hover:bg-emerald-500/25"
            >
              <CreditCard className="h-4 w-4" />
              Export Excel
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-xl">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search member, phone, plan or trainer"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/80 py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-2xl border border-white/10 bg-slate-950/80 py-3 px-4 text-sm text-white outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  <select
                    value={paymentTypeFilter}
                    onChange={(e) => setPaymentTypeFilter(e.target.value)}
                    className="rounded-2xl border border-white/10 bg-slate-950/80 py-3 px-4 text-sm text-white outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="all">All Payment Types</option>
                    <option value="paid">Paid</option>
                    <option value="emi">EMI</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-3">
                  {['all', 'today', 'this-week', 'this-month', 'custom'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setDateFilter(filter)}
                      className={`rounded-2xl px-4 py-2 text-xs font-medium transition ${dateFilter === filter ? 'bg-orange-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                    >
                      {filter === 'this-week' ? 'This Week' : filter === 'this-month' ? 'This Month' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>

                {dateFilter === 'custom' && (
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="rounded-2xl border border-white/10 bg-slate-950/80 py-3 px-4 text-sm text-white outline-none"
                    />
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="rounded-2xl border border-white/10 bg-slate-950/80 py-3 px-4 text-sm text-white outline-none"
                    />
                  </div>
                )}

                {isSuperAdmin && (
                  <AdminFilter value={adminFilter} onChange={handleAdminFilterChange} disabled={loading} />
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-black/20">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Total Memberships</p>
                <p className="mt-4 text-3xl font-semibold text-white">{filteredMemberships.length}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-black/20">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Active</p>
                <p className="mt-4 text-3xl font-semibold text-emerald-300">{filteredMemberships.filter((m) => m.status === 'active').length}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-black/20">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">EMI Plans</p>
                <p className="mt-4 text-3xl font-semibold text-orange-300">{filteredMemberships.filter((m) => m.paymentType === 'EMI').length}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-black/20">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Expiring Soon</p>
                <p className="mt-4 text-3xl font-semibold text-rose-400">{filteredMemberships.filter((m) => {
                  const diff = dayjs(m.endDate).startOf('day').diff(dayjs().startOf('day'), 'day');
                  return diff <= 5 && diff >= 0;
                }).length}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="self-start overflow-x-auto rounded-4xl border border-white/10 bg-slate-900/80 shadow-2xl shadow-black/20">
                <table className="w-full divide-y divide-white/5 text-sm text-white">
                  <thead className="sticky top-0 bg-slate-950/90 text-left text-xs uppercase tracking-[0.24em] text-slate-400">
                    <tr>
                      <th className="whitespace-nowrap px-3 py-4 font-semibold">S.No</th>
                      <th className="whitespace-nowrap px-3 py-4 font-semibold">Name</th>
                      <th className="hidden whitespace-nowrap px-3 py-4 font-semibold sm:table-cell">Phone</th>
                      <th className="whitespace-nowrap px-3 py-4 font-semibold">Plan</th>
                      <th className="hidden whitespace-nowrap px-3 py-4 font-semibold md:table-cell">Start</th>
                      <th className="whitespace-nowrap px-3 py-4 font-semibold">End</th>
                      <th className="hidden whitespace-nowrap px-3 py-4 font-semibold lg:table-cell">Days</th>
                      <th className="hidden whitespace-nowrap px-3 py-4 font-semibold xl:table-cell">Trainer</th>
                      <th className="whitespace-nowrap px-3 py-4 font-semibold">Payment</th>
                      <th className="hidden whitespace-nowrap px-3 py-4 font-semibold xl:table-cell">Next EMI</th>
                      <th className="whitespace-nowrap px-3 py-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-slate-900/80">
                    {paginatedMemberships.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="px-3 py-10 text-center text-slate-400">
                          {error ? error : "No memberships found"}
                        </td>
                      </tr>
                    ) : (
                      paginatedMemberships.map((membership, index) => {
                        return (
                          <tr key={membership.id} className="hover:bg-white/5 transition-colors">
                            <td className="whitespace-nowrap px-3 py-4 font-semibold text-slate-200">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                            <td className="whitespace-nowrap px-3 py-4 font-medium text-white max-w-xs truncate">{membership.name}</td>
                            <td className="hidden whitespace-nowrap px-3 py-4 text-slate-300 sm:table-cell">{membership.phone}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-slate-300 max-w-xs truncate">{membership.planName}</td>
                            <td className="hidden whitespace-nowrap px-3 py-4 text-slate-300 md:table-cell">{formatDate(membership.startDate)}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-slate-300">{formatDate(membership.endDate)}</td>
                            <td className="hidden whitespace-nowrap px-3 py-4 text-slate-300 lg:table-cell">{getDaysRemaining(membership.endDate)}</td>
                            <td className="hidden whitespace-nowrap px-3 py-4 text-slate-300 xl:table-cell">{membership.trainerName}</td>
                            <td className="whitespace-nowrap px-3 py-4">
                              <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold whitespace-nowrap ${membership.paymentType === 'EMI' ? 'bg-orange-500/20 text-orange-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                                {membership.paymentType}
                              </span>
                            </td>
                            <td className="hidden whitespace-nowrap px-3 py-4 text-slate-300 xl:table-cell">{membership.nextEMIDate ? formatDate(membership.nextEMIDate) : "-"}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => showMembershipPopup(membership)}
                                  title="View membership"
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-950/80 text-slate-200 transition hover:bg-slate-900"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => navigate('/admin/buyplanadmin', { state: { membership } })}
                                  title="Edit plan"
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-blue-500/10 text-blue-300 transition hover:bg-blue-500/20"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDelete(membership.id)}
                                  title="Delete membership"
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-rose-500/10 text-rose-200 transition hover:bg-rose-500/20"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-white/10 bg-slate-900/80 rounded-2xl p-4 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Showing <span className="font-semibold text-white">{paginatedMemberships.length}</span> of <span className="font-semibold text-white">{filteredMemberships.length}</span> memberships
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-1 auto-rows-max">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                    <ShieldCheck className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-medium">Notification</p>
                    <p className="mt-1 text-lg font-bold text-white">Plan Complete Alerts</p>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
                  {filteredMemberships.filter((m) => getNotificationBadge(m.endDate, m.status)).slice(0, 8).map((m) => {
                    const note = getNotificationBadge(m.endDate, m.status);
                    return (
                      <div key={m.id} className="group relative rounded-2xl bg-gradient-to-r from-orange-500/10 to-orange-500/5 p-4 border border-orange-500/20 transition hover:border-orange-500/40 hover:bg-gradient-to-r hover:from-orange-500/15 hover:to-orange-500/10">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-white truncate text-sm">{m.name}</p>
                            <p className="text-slate-400 text-xs mt-1 truncate">{m.planName}</p>
                            <p className="text-slate-500 text-xs mt-2">Ends: <span className="text-slate-300">{formatDate(m.endDate)}</span></p>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-3 py-2 text-xs font-bold text-orange-300 whitespace-nowrap flex-shrink-0">
                            <BellRing className="h-3 w-3" />
                            {note}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {filteredMemberships.filter((m) => getNotificationBadge(m.endDate, m.status)).length === 0 && (
                    <div className="rounded-2xl bg-slate-800/50 p-4 text-center">
                      <p className="text-slate-400 text-sm">✓ No alerts within 5 days</p>
                    </div>
                  )}
                </div>
                
                {filteredMemberships.filter((m) => getNotificationBadge(m.endDate, m.status)).length > 0 && (
                  <p className="mt-4 text-xs text-slate-500 border-t border-slate-700 pt-4">
                    Total alerts: <span className="font-semibold text-orange-300">{filteredMemberships.filter((m) => getNotificationBadge(m.endDate, m.status)).length}</span>
                  </p>
                )}
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10">
                    <BellRing className="h-6 w-6 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-medium">Next EMI</p>
                    <p className="mt-1 text-lg font-bold text-white">Upcoming Payments</p>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
                  {filteredMemberships
                    .filter((m) => m.paymentType === "EMI" && m.nextEMIDate)
                    .slice(0, 8)
                    .map((m) => {
                      const emiDate = dayjs(m.nextEMIDate);
                      const daysUntilEMI = emiDate.startOf('day').diff(dayjs().startOf('day'), 'day');
                      const isUpcoming = daysUntilEMI <= 7 && daysUntilEMI >= 0;
                      
                      return (
                        <div key={m.id} className={`group relative rounded-2xl p-4 border transition ${isUpcoming ? 'bg-gradient-to-r from-teal-500/10 to-teal-500/5 border-teal-500/20 hover:border-teal-500/40 hover:bg-gradient-to-r hover:from-teal-500/15 hover:to-teal-500/10' : 'bg-gradient-to-r from-slate-700/10 to-slate-700/5 border-slate-600/20 hover:border-slate-600/40 hover:bg-gradient-to-r hover:from-slate-700/15 hover:to-slate-700/10'}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-white truncate text-sm">{m.name}</p>
                              <p className="text-slate-400 text-xs mt-1 truncate">{m.planName}</p>
                              <p className="text-slate-500 text-xs mt-2">EMI Date: <span className="text-slate-300 font-medium">{formatDate(m.nextEMIDate)}</span></p>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span className={`inline-flex rounded-full px-3 py-2 text-xs font-bold whitespace-nowrap ${isUpcoming ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-600/20 text-slate-300'}`}>
                                {daysUntilEMI < 0 ? 'Overdue' : daysUntilEMI === 0 ? 'Today' : `${daysUntilEMI}d`}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  {filteredMemberships.filter((m) => m.paymentType === "EMI" && m.nextEMIDate).length === 0 && (
                    <div className="rounded-2xl bg-slate-800/50 p-4 text-center">
                      <p className="text-slate-400 text-sm">✓ No upcoming EMI dates</p>
                    </div>
                  )}
                </div>
                
                {filteredMemberships.filter((m) => m.paymentType === "EMI" && m.nextEMIDate).length > 0 && (
                  <p className="mt-4 text-xs text-slate-500 border-t border-slate-700 pt-4">
                    Total EMI plans: <span className="font-semibold text-teal-300">{filteredMemberships.filter((m) => m.paymentType === "EMI" && m.nextEMIDate).length}</span>
                  </p>
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Memberships;
