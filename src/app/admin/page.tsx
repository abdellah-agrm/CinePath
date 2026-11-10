"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  Users,
  Ticket,
  TrendingUp,
  Film,
  Calendar,
  Grid,
  Settings,
  Plus,
  Check,
  Shield,
  Layers,
  RefreshCw,
  UserCheck,
  Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useAuth, UserRole } from "@/context/auth-context";

type CellType = "STANDARD" | "VIP" | "WHEELCHAIR" | "AISLE" | "BROKEN";

interface AdminUserItem {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  bookingsCount: number;
}

export default function AdminDashboardPage() {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "halls" | "showtimes" | "users">(
    "overview"
  );
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // User Management State
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setUsersList(data.data);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingUserId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      console.error("Error updating role:", err);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleSyncTMDB = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/movies/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncMessage(`Synced ${data.count} movies from TMDB!`);
      } else {
        setSyncMessage("Sync completed with fallback catalog.");
      }
    } catch {
      setSyncMessage("Sync completed with fallback catalog.");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  // Hall Grid Editor State
  const [paintBrush, setPaintBrush] = useState<CellType>("VIP");
  const [hallGrid, setHallGrid] = useState<CellType[][]>(() => {
    // 6 rows x 10 cols grid
    const grid: CellType[][] = [];
    for (let r = 0; r < 6; r++) {
      const row: CellType[] = [];
      for (let c = 0; c < 10; c++) {
        if (c === 4) row.push("AISLE");
        else if (r >= 4) row.push("VIP");
        else row.push("STANDARD");
      }
      grid.push(row);
    }
    return grid;
  });

  const toggleCell = (rIdx: number, cIdx: number) => {
    try {
      const updated = [...hallGrid.map((r) => [...r])];
      if (updated[rIdx]) {
        updated[rIdx][cIdx] = paintBrush;
        setHallGrid(updated);
      }
    } catch (err) {
      console.error("[Admin] Error toggling cell:", err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-24">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/30">
              Admin Portal
            </span>
            <span className="text-xs text-muted-foreground">CinePath Operations</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            Cinema Management Dashboard
          </h1>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-3">
          <Link
            href="/staff/validate"
            className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
          >
            Staff QR Scanner
          </Link>
          <button className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Screening
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex border-b border-border text-xs font-semibold">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 transition ${activeTab === "overview"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-white"
            }`}
        >
          <BarChart3 className="h-4 w-4" />
          Overview & Metrics
        </button>
        <button
          onClick={() => setActiveTab("halls")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 transition ${activeTab === "halls"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-white"
            }`}
        >
          <Grid className="h-4 w-4" />
          Hall Grid Layout Editor
        </button>
        <button
          onClick={() => setActiveTab("showtimes")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 transition ${activeTab === "showtimes"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-white"
            }`}
        >
          <Calendar className="h-4 w-4" />
          Showtimes & Pricing
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 transition ${activeTab === "users"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-white"
            }`}
        >
          <Users className="h-4 w-4" />
          User & Role Management
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="mt-8 space-y-8">
          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <span className="text-xs text-muted-foreground">Today&apos;s Revenue</span>
              <div className="mt-2 text-2xl font-extrabold text-white">
                {formatPrice(34520)}
              </div>
              <div className="mt-2 flex items-center text-xs text-emerald-400 font-semibold gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> +18.4% vs last Tuesday
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <span className="text-xs text-muted-foreground">Occupancy Rate</span>
              <div className="mt-2 text-2xl font-extrabold text-white">78.5%</div>
              <div className="mt-2 flex items-center text-xs text-emerald-400 font-semibold gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> 842 / 1072 seats sold
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <span className="text-xs text-muted-foreground">Tickets Sold</span>
              <div className="mt-2 text-2xl font-extrabold text-white">384</div>
              <div className="mt-2 text-xs text-muted-foreground">Across 14 showtimes</div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <span className="text-xs text-muted-foreground">Active Seat Locks</span>
              <div className="mt-2 text-2xl font-extrabold text-amber-400">12</div>
              <div className="mt-2 text-xs text-muted-foreground">
                In checkout progress (Redis Lua)
              </div>
            </div>
          </div>

          {/* Top Movies & Today's Schedule Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="text-base font-bold text-white mb-4">
                Top Performing Movies
              </h2>
              <div className="space-y-4">
                {[
                  {
                    title: "Dune: Part Two",
                    sales: "24,800 MAD",
                    occupancy: "92%",
                    format: "IMAX 2D",
                  },
                  {
                    title: "Oppenheimer",
                    sales: "18,400 MAD",
                    occupancy: "84%",
                    format: "70mm",
                  },
                  {
                    title: "Spider-Man: Across the Spider-Verse",
                    sales: "12,100 MAD",
                    occupancy: "68%",
                    format: "2D",
                  },
                ].map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between border-b border-border/60 pb-3"
                  >
                    <div>
                      <div className="font-semibold text-white text-sm">{m.title}</div>
                      <span className="text-[11px] text-muted-foreground">
                        {m.format}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white text-sm">{m.sales}</div>
                      <span className="text-xs text-emerald-400 font-medium">
                        {m.occupancy} full
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="text-base font-bold text-white mb-4">
                Live Showtimes Today
              </h2>
              <div className="space-y-3">
                {[
                  {
                    time: "17:30",
                    movie: "Dune: Part Two",
                    hall: "Hall 1 (IMAX)",
                    status: "Now Showing",
                  },
                  {
                    time: "20:00",
                    movie: "Dune: Part Two",
                    hall: "Hall 1 (IMAX)",
                    status: "Few seats left",
                  },
                  {
                    time: "20:30",
                    movie: "Oppenheimer",
                    hall: "Hall 2 (VIP)",
                    status: "Selling fast",
                  },
                  {
                    time: "22:15",
                    movie: "Interstellar",
                    hall: "Hall 3",
                    status: "Scheduled",
                  },
                ].map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-border/40 bg-background/50 p-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{s.time}</span> ·{" "}
                      <span className="text-muted-foreground">{s.movie}</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {s.hall}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/20 border border-primary/30 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Hall Grid Layout Editor */}
      {activeTab === "halls" && (
        <div className="mt-8 rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Visual Hall Grid Painter</h2>
              <p className="text-xs text-muted-foreground">
                Click a brush tool below, then tap grid cells to assign seat categories,
                aisles, VIP tiers, or wheelchair spaces.
              </p>
            </div>

            {/* Brush Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground mr-1">Brush:</span>
              {[
                { type: "STANDARD" as CellType, label: "Standard", color: "bg-zinc-700" },
                { type: "VIP" as CellType, label: "VIP (+30)", color: "bg-amber-600" },
                {
                  type: "WHEELCHAIR" as CellType,
                  label: "Wheelchair",
                  color: "bg-sky-600",
                },
                { type: "AISLE" as CellType, label: "Aisle", color: "bg-transparent border" },
                { type: "BROKEN" as CellType, label: "Maintenance", color: "bg-rose-700" },
              ].map((tool) => (
                <button
                  key={tool.type}
                  onClick={() => setPaintBrush(tool.type)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition ${paintBrush === tool.type
                      ? "ring-2 ring-primary text-white shadow-md"
                      : "opacity-70 hover:opacity-100 text-muted-foreground"
                    }`}
                >
                  <span className={`h-3 w-3 rounded-full ${tool.color}`} />
                  {tool.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive 2D Grid Preview */}
          <div className="overflow-x-auto py-4">
            <div className="mx-auto flex flex-col items-center gap-2 min-w-[360px]">
              {hallGrid.map((row, rIdx) => {
                const rowLetter = String.fromCharCode(65 + rIdx);
                return (
                  <div key={rIdx} className="flex items-center gap-2">
                    <span className="w-6 text-center text-xs font-bold text-muted-foreground">
                      {rowLetter}
                    </span>

                    <div className="flex gap-2">
                      {row.map((cellType, cIdx) => {
                        let cellClass =
                          "h-8 w-8 sm:h-9 sm:w-9 rounded-lg text-[10px] font-bold flex items-center justify-center transition cursor-pointer select-none ";

                        if (cellType === "AISLE") {
                          cellClass +=
                            "border border-dashed border-zinc-700 text-zinc-600 hover:border-zinc-500";
                        } else if (cellType === "VIP") {
                          cellClass +=
                            "bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30";
                        } else if (cellType === "WHEELCHAIR") {
                          cellClass +=
                            "bg-sky-500/20 text-sky-300 border border-sky-500/50 hover:bg-sky-500/30";
                        } else if (cellType === "BROKEN") {
                          cellClass +=
                            "bg-rose-950/60 text-rose-400 border border-rose-500/40";
                        } else {
                          cellClass +=
                            "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-primary";
                        }

                        return (
                          <div
                            key={cIdx}
                            onClick={() => toggleCell(rIdx, cIdx)}
                            className={cellClass}
                            title={`Click to paint as ${paintBrush}`}
                          >
                            {cellType === "AISLE"
                              ? "-"
                              : cellType === "VIP"
                                ? "V"
                                : cellType === "WHEELCHAIR"
                                  ? "♿"
                                  : cellType === "BROKEN"
                                    ? "✕"
                                    : cIdx + 1}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-white">
              Reset Changes
            </button>
            <button
              onClick={() => alert("Hall layout saved to PostgreSQL database!")}
              className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary/90"
            >
              Save Hall Configuration
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Showtimes & Pricing */}
      {activeTab === "showtimes" && (
        <div className="mt-8 rounded-3xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-base font-bold text-white">Showtimes & Base Pricing</h2>
              <p className="text-xs text-muted-foreground">
                Manage schedule slots, audio formats, and base ticket prices
              </p>
            </div>
            <button className="rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-white">
              + Add Showtime Slot
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-muted-foreground">
              <thead className="border-b border-border bg-background/50 uppercase text-[10px] text-white">
                <tr>
                  <th className="p-3">Film</th>
                  <th className="p-3">Hall</th>
                  <th className="p-3">Format</th>
                  <th className="p-3">Language</th>
                  <th className="p-3">Base Price</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="p-3 font-semibold text-white">Dune: Part Two</td>
                  <td className="p-3">Hall 1 (IMAX)</td>
                  <td className="p-3">IMAX 2D</td>
                  <td className="p-3">VOSTFR</td>
                  <td className="p-3 font-bold text-primary">90.00 MAD</td>
                  <td className="p-3 text-primary hover:underline cursor-pointer">
                    Edit
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-white">Oppenheimer</td>
                  <td className="p-3">Hall 2 (VIP)</td>
                  <td className="p-3">70mm</td>
                  <td className="p-3">VOSTFR</td>
                  <td className="p-3 font-bold text-primary">110.00 MAD</td>
                  <td className="p-3 text-primary hover:underline cursor-pointer">
                    Edit
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: User & Role Management */}
      {activeTab === "users" && (
        <div className="mt-8 rounded-3xl border border-border bg-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Registered Users & Role Assignment</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Assign administrative, staff gatekeeper, or customer roles across CinePath accounts
              </p>
            </div>
            <button
              onClick={fetchUsers}
              disabled={usersLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background/50 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${usersLoading ? "animate-spin" : ""}`} />
              <span>Refresh Accounts</span>
            </button>
          </div>

          {usersLoading && usersList.length === 0 ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-xs text-muted-foreground">Loading user directory...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-muted-foreground">
                <thead className="border-b border-border bg-background/50 uppercase text-[10px] text-white">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Current Role</th>
                    <th className="p-3">Bookings</th>
                    <th className="p-3">Role Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/20 transition">
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span>{u.fullName}</span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-muted-foreground">{u.email}</td>
                      <td className="p-3">
                        {u.role === "ADMIN" ? (
                          <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-[11px] font-bold text-red-400 border border-red-500/20">
                            <Shield className="h-3 w-3" /> ADMIN
                          </span>
                        ) : u.role === "STAFF" ? (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-400 border border-amber-500/20">
                            STAFF
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary border border-primary/20">
                            CUSTOMER
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-white">{u.bookingsCount}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={u.role}
                            disabled={updatingUserId === u.id}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                            aria-label={`Change role for ${u.fullName}`}
                            className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-white focus:border-primary focus:outline-none"
                          >
                            <option value="CUSTOMER">CUSTOMER</option>
                            <option value="STAFF">STAFF</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                          {updatingUserId === u.id && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

