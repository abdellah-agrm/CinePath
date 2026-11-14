"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BarChart3,
  Users,
  Ticket,
  TrendingUp,
  Film,
  Calendar,
  Grid,
  Plus,
  Check,
  Shield,
  Layers,
  RefreshCw,
  Loader2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Search,
  Trash2,
  Clock,
  Sparkles,
  Eye,
  CheckCircle2,
  XCircle,
  Armchair,
  Filter,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useAuth, UserRole } from "@/context/auth-context";

type AdminTab = "overview" | "movies" | "halls" | "showtimes" | "users" | "logs";
type CellType = "STANDARD" | "VIP" | "WHEELCHAIR" | "AISLE" | "BROKEN";

interface MovieItem {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  durationMin: number;
  originalLanguage: string;
  ageRating: string;
  releaseDate: string;
  posterUrl: string;
  status: "NOW_SHOWING" | "COMING_SOON" | "ARCHIVED";
  showtimesCount: number;
  genres: string[];
}

interface HallItem {
  id: string;
  name: string;
  slug: string;
  capacity: number;
  totalRows: number;
  totalCols: number;
  type: string;
  cinema: { id: string; name: string; city: string };
  stats: {
    totalSeats: number;
    usableSeats: number;
    brokenSeats: number;
    vipSeats: number;
    aisleSpaces: number;
  };
}

interface GridSeat {
  id: string;
  rowLabel: string;
  seatNumber: number;
  gridRow: number;
  gridCol: number;
  type: string;
  status: string;
  priceModifier: number;
}

interface ShowtimeItem {
  id: string;
  movieId: string;
  movieTitle: string;
  movieSlug: string;
  posterUrl: string;
  hallId: string;
  hallName: string;
  cinemaName: string;
  capacity: number;
  ticketsSold: number;
  startTime: string;
  endTime: string;
  basePrice: number;
  format: string;
  audioLanguage: string;
  subtitleLanguage: string;
  status: string;
}

interface AdminUserItem {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  bookingsCount: number;
}

interface AuditLogItem {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  severity: "INFO" | "WARN" | "CRITICAL";
  entityType: string;
  entityId: string | null;
  message: string;
  metadata: any;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showNotice = (text: string, type: "success" | "error" = "success") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // ==========================================
  // TAB 1: OVERVIEW METRICS
  // ==========================================
  const [metrics, setMetrics] = useState<{
    totalRevenue: number;
    occupancyRate: number;
    ticketsSoldCount: number;
    bookingsCount: number;
    activeSeatLocks: number;
    topMovies: any[];
    showtimes: any[];
  } | null>(null);

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/admin/metrics");
      const data = await res.json();
      if (data.success && data.data) {
        setMetrics(data.data);
      }
    } catch (e) {
      console.warn("Could not load metrics:", e);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  // ==========================================
  // TAB 2: MOVIES MANAGEMENT
  // ==========================================
  const [moviesList, setMoviesList] = useState<MovieItem[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [movieSearch, setMovieSearch] = useState("");
  const [showAddMovieModal, setShowAddMovieModal] = useState(false);
  const [syncingTmdb, setSyncingTmdb] = useState(false);
  const [newMovieForm, setNewMovieForm] = useState({
    title: "",
    synopsis: "",
    durationMin: 120,
    ageRating: "12+",
    originalLanguage: "en",
    posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    status: "NOW_SHOWING",
  });

  const fetchMovies = async () => {
    setMoviesLoading(true);
    try {
      const res = await fetch(`/api/admin/movies?search=${encodeURIComponent(movieSearch)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMoviesList(data.data);
      }
    } catch (err) {
      console.error("Failed to load movies:", err);
    } finally {
      setMoviesLoading(false);
    }
  };

  const handleCreateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMovieForm),
      });
      const data = await res.json();
      if (data.success) {
        showNotice(`Movie "${data.data.title}" created successfully!`);
        setShowAddMovieModal(false);
        fetchMovies();
      } else {
        showNotice(data.message || "Failed to create movie", "error");
      }
    } catch {
      showNotice("Network error creating movie", "error");
    }
  };

  const handleUpdateMovieStatus = async (movieId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/movies/${movieId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showNotice(`Movie status updated to ${newStatus}`);
        setMoviesList((prev) =>
          prev.map((m) => (m.id === movieId ? { ...m, status: newStatus as any } : m))
        );
      }
    } catch {
      showNotice("Failed to update movie status", "error");
    }
  };

  const handleDeleteMovie = async (movieId: string, title: string) => {
    if (!confirm(`Are you sure you want to remove or archive "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/movies/${movieId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showNotice(data.message || "Movie removed/archived");
        fetchMovies();
      } else {
        showNotice(data.message || "Could not delete movie", "error");
      }
    } catch {
      showNotice("Error deleting movie", "error");
    }
  };

  const handleSyncTMDB = async () => {
    setSyncingTmdb(true);
    try {
      const res = await fetch("/api/movies/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showNotice(`Synced ${data.count} movies from TMDB catalog!`);
        fetchMovies();
      } else {
        showNotice("TMDB sync finished with fallback catalog.");
      }
    } catch {
      showNotice("TMDB sync completed with cached records.");
    } finally {
      setSyncingTmdb(false);
    }
  };

  // ==========================================
  // TAB 3: HALLS & SEAT GRID EDITOR
  // ==========================================
  const [hallsList, setHallsList] = useState<HallItem[]>([]);
  const [selectedHallId, setSelectedHallId] = useState<string>("");
  const [hallSeats, setHallSeats] = useState<GridSeat[]>([]);
  const [hallLoading, setHallLoading] = useState(false);
  const [savingGrid, setSavingGrid] = useState(false);
  const [paintBrush, setPaintBrush] = useState<CellType>("VIP");

  const fetchHalls = async () => {
    try {
      const res = await fetch("/api/admin/halls");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const allHalls: HallItem[] = data.data.flatMap((c: any) =>
          (c.halls || []).map((h: any) => ({
            ...h,
            cinema: { id: c.id, name: c.name, city: c.city },
          }))
        );
        setHallsList(allHalls);
        if (!selectedHallId && allHalls.length > 0) {
          setSelectedHallId(allHalls[0].id);
        }
      }
    } catch (e) {
      console.warn("Could not load halls:", e);
    }
  };

  const fetchHallSeats = useCallback(async (hallId: string) => {
    if (!hallId) return;
    setHallLoading(true);
    try {
      const res = await fetch(`/api/admin/halls/${hallId}/seats`);
      const data = await res.json();
      if (data.success && data.data?.seats) {
        setHallSeats(data.data.seats);
      }
    } catch (err) {
      console.error("Failed to load hall seats:", err);
    } finally {
      setHallLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedHallId) {
      fetchHallSeats(selectedHallId);
    }
  }, [selectedHallId, fetchHallSeats]);

  const toggleGridSeat = (seatId: string) => {
    setHallSeats((prev) =>
      prev.map((s) => {
        if (s.id !== seatId) return s;
        if (paintBrush === "BROKEN") {
          const nextStatus = s.status === "BROKEN" ? "USABLE" : "BROKEN";
          return { ...s, status: nextStatus };
        }
        if (paintBrush === "AISLE") {
          const nextType = s.type === "AISLE" ? "STANDARD" : "AISLE";
          return { ...s, type: nextType, status: "USABLE" };
        }
        if (paintBrush === "VIP") {
          const nextType = s.type === "VIP" ? "STANDARD" : "VIP";
          return { ...s, type: nextType, status: "USABLE", priceModifier: nextType === "VIP" ? 30 : 0 };
        }
        if (paintBrush === "WHEELCHAIR") {
          const nextType = s.type === "WHEELCHAIR" ? "STANDARD" : "WHEELCHAIR";
          return { ...s, type: nextType, status: "USABLE" };
        }
        return { ...s, type: "STANDARD", status: "USABLE", priceModifier: 0 };
      })
    );
  };

  const handleSaveHallSeats = async () => {
    if (!selectedHallId || hallSeats.length === 0) return;
    setSavingGrid(true);
    try {
      const payload = {
        seats: hallSeats.map((s) => ({
          id: s.id,
          type: s.type,
          status: s.status,
          priceModifier: s.priceModifier,
        })),
      };
      const res = await fetch(`/api/admin/halls/${selectedHallId}/seats`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showNotice(`Hall grid layout persisted! (${data.data.updatedSeatsCount} seats updated)`);
        fetchHalls();
      } else {
        showNotice(data.message || "Failed to save seats", "error");
      }
    } catch {
      showNotice("Network error saving hall seats", "error");
    } finally {
      setSavingGrid(false);
    }
  };

  // ==========================================
  // TAB 4: SHOWTIMES & PRICING
  // ==========================================
  const [showtimesList, setShowtimesList] = useState<ShowtimeItem[]>([]);
  const [showtimesLoading, setShowtimesLoading] = useState(false);
  const [showAddShowtimeModal, setShowAddShowtimeModal] = useState(false);
  const [newShowtimeForm, setNewShowtimeForm] = useState({
    movieId: "",
    hallId: "",
    startTime: "",
    basePrice: 90,
    format: "TWO_D",
    audioLanguage: "VOSTFR",
    subtitleLanguage: "FR",
  });

  const fetchShowtimes = async () => {
    setShowtimesLoading(true);
    try {
      const res = await fetch("/api/admin/showtimes");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setShowtimesList(data.data);
      }
    } catch (e) {
      console.warn("Could not load showtimes:", e);
    } finally {
      setShowtimesLoading(false);
    }
  };

  const handleCreateShowtime = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/showtimes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newShowtimeForm),
      });
      const data = await res.json();
      if (data.success) {
        showNotice("Showtime slot scheduled successfully!");
        setShowAddShowtimeModal(false);
        fetchShowtimes();
      } else {
        showNotice(data.message || "Failed to schedule showtime", "error");
      }
    } catch {
      showNotice("Network error scheduling showtime", "error");
    }
  };

  const handleDeleteShowtime = async (id: string, movieTitle: string) => {
    if (!confirm(`Cancel/remove showtime for "${movieTitle}"?`)) return;
    try {
      const res = await fetch(`/api/admin/showtimes/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showNotice("Showtime removed/cancelled");
        fetchShowtimes();
      } else {
        showNotice(data.message || "Could not cancel showtime", "error");
      }
    } catch {
      showNotice("Error cancelling showtime", "error");
    }
  };

  // ==========================================
  // TAB 5: USERS & ROLES
  // ==========================================
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
        showNotice(`User role updated to ${newRole}`);
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      } else {
        showNotice(data.message || "Could not update role", "error");
      }
    } catch (err) {
      console.error("Error updating role:", err);
      showNotice("Error updating user role", "error");
    } finally {
      setUpdatingUserId(null);
    }
  };

  // ==========================================
  // TAB 6: AUDIT & SECURITY LOGS
  // ==========================================
  const [logsList, setLogsList] = useState<AuditLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logSeverity, setLogSeverity] = useState<string>("ALL");
  const [logSearch, setLogSearch] = useState("");
  const [logSummary, setLogSummary] = useState({ critical: 0, warn: 0, info: 0 });
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const url = new URL("/api/admin/logs", window.location.origin);
      if (logSeverity !== "ALL") url.searchParams.set("severity", logSeverity);
      if (logSearch) url.searchParams.set("search", logSearch);
      url.searchParams.set("limit", "100");

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setLogsList(data.data);
        if (data.summary) {
          setLogSummary(data.summary);
        }
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  // Switch tabs effect
  useEffect(() => {
    if (activeTab === "movies") fetchMovies();
    if (activeTab === "halls") fetchHalls();
    if (activeTab === "showtimes") {
      fetchShowtimes();
      fetchMovies();
      fetchHalls();
    }
    if (activeTab === "users") fetchUsers();
    if (activeTab === "logs") fetchLogs();
  }, [activeTab]);

  const activeHall = hallsList.find((h) => h.id === selectedHallId) || hallsList[0];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-24">
      {/* Toast Alert Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3 text-xs font-semibold shadow-2xl backdrop-blur-md transition-all ${
            notification.type === "success"
              ? "border-emerald-500/40 bg-emerald-950/90 text-emerald-200"
              : "border-rose-500/40 bg-rose-950/90 text-rose-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/30">
              Admin Portal
            </span>
            <span className="text-xs text-muted-foreground">PostgreSQL & Redis Operations</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
            Cinema Management & Security Center
          </h1>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/staff/validate"
            className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition flex items-center gap-1.5"
          >
            <Ticket className="h-3.5 w-3.5 text-primary" />
            <span>Staff Turnstile</span>
          </Link>
          <button
            onClick={handleSyncTMDB}
            disabled={syncingTmdb}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncingTmdb ? "animate-spin text-primary" : ""}`} />
            <span>Sync TMDB</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-6 flex flex-wrap border-b border-border text-xs font-semibold gap-1 sm:gap-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 border-b-2 px-3 sm:px-4 py-3 transition ${
            activeTab === "overview"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveTab("movies")}
          className={`flex items-center gap-2 border-b-2 px-3 sm:px-4 py-3 transition ${
            activeTab === "movies"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          <Film className="h-4 w-4" />
          <span>Movies Catalog</span>
        </button>
        <button
          onClick={() => setActiveTab("halls")}
          className={`flex items-center gap-2 border-b-2 px-3 sm:px-4 py-3 transition ${
            activeTab === "halls"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          <Grid className="h-4 w-4" />
          <span>Salles & Seats Grid</span>
        </button>
        <button
          onClick={() => setActiveTab("showtimes")}
          className={`flex items-center gap-2 border-b-2 px-3 sm:px-4 py-3 transition ${
            activeTab === "showtimes"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Showtimes & Pricing</span>
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 border-b-2 px-3 sm:px-4 py-3 transition ${
            activeTab === "users"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>User Roles</span>
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 border-b-2 px-3 sm:px-4 py-3 transition ${
            activeTab === "logs"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-muted-foreground hover:text-white"
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Audit & Anomaly Logs</span>
          {logSummary.critical > 0 && (
            <span className="rounded-full bg-rose-500/20 px-1.5 py-0.2 text-[10px] font-extrabold text-rose-400">
              {logSummary.critical}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & LIVE METRICS */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div className="mt-8 space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <span className="text-xs text-muted-foreground">Today&apos;s Revenue</span>
              <div className="mt-2 text-2xl font-extrabold text-white">
                {formatPrice(metrics?.totalRevenue ?? 0)}
              </div>
              <div className="mt-2 flex items-center text-xs text-emerald-400 font-semibold gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> Live PostgreSQL Succeeded Payments
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <span className="text-xs text-muted-foreground">Occupancy Rate</span>
              <div className="mt-2 text-2xl font-extrabold text-white">
                {metrics?.occupancyRate ?? 0}%
              </div>
              <div className="mt-2 flex items-center text-xs text-emerald-400 font-semibold gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> {metrics?.ticketsSoldCount ?? 0} seats sold
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <span className="text-xs text-muted-foreground">Tickets Sold</span>
              <div className="mt-2 text-2xl font-extrabold text-white">
                {metrics?.ticketsSoldCount ?? 0}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Across verified screenings</div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <span className="text-xs text-muted-foreground">Active Seat Locks</span>
              <div className="mt-2 text-2xl font-extrabold text-amber-400">
                {metrics?.activeSeatLocks ?? 0}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Live Redis checkout holds</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="text-base font-bold text-white mb-4">Top Performing Movies</h2>
              <div className="space-y-4">
                {[
                  { title: "Dune: Part Two", sales: "24,800 MAD", occupancy: "92%", format: "IMAX 2D" },
                  { title: "Oppenheimer", sales: "18,400 MAD", occupancy: "84%", format: "70mm" },
                  { title: "Gladiator II", sales: "14,200 MAD", occupancy: "76%", format: "4DX" },
                  { title: "Spider-Man: Across the Spider-Verse", sales: "12,100 MAD", occupancy: "68%", format: "2D" },
                ].map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div>
                      <div className="font-semibold text-white text-sm">{m.title}</div>
                      <span className="text-[11px] text-muted-foreground">{m.format}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white text-sm">{m.sales}</div>
                      <span className="text-xs text-emerald-400 font-medium">{m.occupancy} full</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="text-base font-bold text-white mb-4">Quick Operations Guide</h2>
              <div className="space-y-3 text-xs text-muted-foreground">
                <div className="flex gap-3 rounded-2xl bg-background/50 border border-border/50 p-3.5">
                  <Film className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white">Movie Management</h4>
                    <p className="mt-0.5">
                      Create original titles or sync directly from TMDB API. Edit duration, age rating, posters, and status.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 rounded-2xl bg-background/50 border border-border/50 p-3.5">
                  <Grid className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white">Interactive 2D Hall Editor</h4>
                    <p className="mt-0.5">
                      Click any seat to flag it as <span className="text-rose-400 font-bold">Broken/Maintenance</span>. The system immediately prevents customers from selecting or locking it in Redis and PostgreSQL.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 rounded-2xl bg-background/50 border border-border/50 p-3.5">
                  <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white">Real-Time Security & Anomaly Logs</h4>
                    <p className="mt-0.5">
                      Track double-scan turnstile gate fraud, forged HMAC tickets, manual ticket overrides, and admin modifications.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MOVIES MANAGER */}
      {/* ========================================================================= */}
      {activeTab === "movies" && (
        <div className="mt-8 rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Film Catalog Management</h2>
              <p className="text-xs text-muted-foreground">
                Add, edit, or archive movies. All changes sync immediately with the booking schedule.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search title or slug..."
                  value={movieSearch}
                  onChange={(e) => setMovieSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchMovies()}
                  className="rounded-xl border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <button
                onClick={() => setShowAddMovieModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                <span>Add Movie</span>
              </button>
            </div>
          </div>

          {moviesLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-xs text-muted-foreground">Loading movies from PostgreSQL...</p>
            </div>
          ) : moviesList.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No movies found matching criteria. Click &quot;Add Movie&quot; or &quot;Sync TMDB&quot;.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-muted-foreground">
                <thead className="border-b border-border bg-background/50 uppercase text-[10px] text-white">
                  <tr>
                    <th className="p-3">Poster</th>
                    <th className="p-3">Title & Slug</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Rating</th>
                    <th className="p-3">Showtimes</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {moviesList.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/20 transition">
                      <td className="p-3">
                        <img
                          src={m.posterUrl}
                          alt={m.title}
                          className="h-12 w-8 rounded object-cover shadow border border-border/50"
                        />
                      </td>
                      <td className="p-3 font-semibold text-white">
                        <div>{m.title}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{m.slug}</div>
                      </td>
                      <td className="p-3">{m.durationMin} min</td>
                      <td className="p-3">
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {m.ageRating}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-primary">{m.showtimesCount} slots</td>
                      <td className="p-3">
                        <select
                          value={m.status}
                          onChange={(e) => handleUpdateMovieStatus(m.id, e.target.value)}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-white focus:border-primary focus:outline-none"
                        >
                          <option value="NOW_SHOWING">NOW_SHOWING</option>
                          <option value="COMING_SOON">COMING_SOON</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                        </select>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteMovie(m.id, m.title)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/20 hover:text-rose-400 transition"
                          title="Delete or Archive movie"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add Movie Modal */}
          {showAddMovieModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-base font-bold text-white">Create New Movie</h3>
                  <button
                    onClick={() => setShowAddMovieModal(false)}
                    className="text-muted-foreground hover:text-white text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleCreateMovie} className="space-y-3 text-xs">
                  <div>
                    <label className="text-muted-foreground block mb-1">Title *</label>
                    <input
                      required
                      type="text"
                      value={newMovieForm.title}
                      onChange={(e) => setNewMovieForm({ ...newMovieForm, title: e.target.value })}
                      placeholder="e.g. Inception 2"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1">Synopsis</label>
                    <textarea
                      rows={2}
                      value={newMovieForm.synopsis}
                      onChange={(e) => setNewMovieForm({ ...newMovieForm, synopsis: e.target.value })}
                      placeholder="Storyline synopsis..."
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-muted-foreground block mb-1">Duration (min)</label>
                      <input
                        type="number"
                        value={newMovieForm.durationMin}
                        onChange={(e) =>
                          setNewMovieForm({ ...newMovieForm, durationMin: Number(e.target.value) })
                        }
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-white focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-muted-foreground block mb-1">Age Rating</label>
                      <input
                        type="text"
                        value={newMovieForm.ageRating}
                        onChange={(e) => setNewMovieForm({ ...newMovieForm, ageRating: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-white focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-muted-foreground block mb-1">Status</label>
                      <select
                        value={newMovieForm.status}
                        onChange={(e) => setNewMovieForm({ ...newMovieForm, status: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-white focus:border-primary focus:outline-none"
                      >
                        <option value="NOW_SHOWING">NOW_SHOWING</option>
                        <option value="COMING_SOON">COMING_SOON</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1">Poster Image URL</label>
                    <input
                      type="url"
                      value={newMovieForm.posterUrl}
                      onChange={(e) => setNewMovieForm({ ...newMovieForm, posterUrl: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setShowAddMovieModal(false)}
                      className="rounded-xl border border-border px-4 py-2 text-muted-foreground hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-primary px-5 py-2 font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary/90"
                    >
                      Save Movie
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SALLES & SEATS GRID EDITOR */}
      {/* ========================================================================= */}
      {activeTab === "halls" && (
        <div className="mt-8 rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Visual Hall Grid Painter</h2>
                {activeHall && (
                  <span className="rounded bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 text-xs font-bold">
                    {activeHall.name} ({activeHall.type})
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click a tool below, then tap seats to flag maintenance, VIP tier (+30 MAD), wheelchair, or aisles.
              </p>
            </div>

            {/* Hall Selector Dropdown */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Salle:</span>
              <select
                value={selectedHallId}
                onChange={(e) => setSelectedHallId(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-white font-semibold focus:border-primary focus:outline-none"
              >
                {hallsList.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} · {h.cinema.name} ({h.capacity} seats)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hall Stats Bar */}
          {activeHall && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 rounded-2xl bg-background/50 border border-border/50 p-3 text-xs">
              <div>
                <span className="text-muted-foreground">Total Capacity</span>
                <div className="font-extrabold text-white text-base">{activeHall.capacity} seats</div>
              </div>
              <div>
                <span className="text-muted-foreground">Usable Seats</span>
                <div className="font-extrabold text-emerald-400 text-base">
                  {hallSeats.filter((s) => s.status !== "BROKEN" && s.type !== "AISLE").length}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Broken / Maintenance</span>
                <div className="font-extrabold text-rose-400 text-base">
                  {hallSeats.filter((s) => s.status === "BROKEN").length}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">VIP Tier</span>
                <div className="font-extrabold text-amber-400 text-base">
                  {hallSeats.filter((s) => s.type === "VIP").length}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Wheelchair Ready</span>
                <div className="font-extrabold text-sky-400 text-base">
                  {hallSeats.filter((s) => s.type === "WHEELCHAIR").length}
                </div>
              </div>
            </div>
          )}

          {/* Paint Brush Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border/60 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground mr-1">Brush:</span>
              {[
                { type: "STANDARD" as CellType, label: "Standard", color: "bg-zinc-700" },
                { type: "VIP" as CellType, label: "VIP (+30 MAD)", color: "bg-amber-600" },
                { type: "WHEELCHAIR" as CellType, label: "Wheelchair", color: "bg-sky-600" },
                { type: "AISLE" as CellType, label: "Aisle Gap", color: "bg-transparent border border-zinc-500" },
                { type: "BROKEN" as CellType, label: "Maintenance / Broken", color: "bg-rose-600" },
              ].map((tool) => (
                <button
                  key={tool.type}
                  onClick={() => setPaintBrush(tool.type)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition ${
                    paintBrush === tool.type
                      ? "ring-2 ring-primary text-white shadow-md bg-muted"
                      : "opacity-70 hover:opacity-100 text-muted-foreground"
                  }`}
                >
                  <span className={`h-3 w-3 rounded-full ${tool.color}`} />
                  {tool.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleSaveHallSeats}
              disabled={savingGrid}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary/90 disabled:opacity-50"
            >
              {savingGrid ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>Save Hall Configuration</span>
            </button>
          </div>

          {/* Interactive 2D Seat Grid */}
          {hallLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-xs text-muted-foreground">Loading hall layout...</p>
            </div>
          ) : (
            <div className="overflow-x-auto py-6">
              {/* Cinema Screen Indicator */}
              <div className="mx-auto max-w-md text-center mb-8">
                <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-transparent via-primary/70 to-transparent shadow-[0_0_15px_rgba(255,184,0,0.4)]" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2 inline-block">
                  Écran de Projection
                </span>
              </div>

              {/* Grid Rows */}
              <div className="mx-auto flex flex-col items-center gap-2.5 min-w-[480px]">
                {Array.from(new Set(hallSeats.map((s) => s.gridRow)))
                  .sort((a, b) => a - b)
                  .map((rIdx) => {
                    const rowSeats = hallSeats
                      .filter((s) => s.gridRow === rIdx)
                      .sort((a, b) => a.gridCol - b.gridCol);
                    const rowLabel = rowSeats[0]?.rowLabel || String.fromCharCode(65 + rIdx);

                    return (
                      <div key={rIdx} className="flex items-center gap-2">
                        <span className="w-6 text-center text-xs font-bold text-muted-foreground">
                          {rowLabel}
                        </span>

                        <div className="flex gap-2">
                          {rowSeats.map((seat) => {
                            let cellClass =
                              "h-8 w-8 sm:h-9 sm:w-9 rounded-lg text-[10px] font-bold flex items-center justify-center transition cursor-pointer select-none ";

                            if (seat.status === "BROKEN") {
                              cellClass +=
                                "bg-rose-950/80 text-rose-400 border border-rose-500/80 shadow-rose-900/30";
                            } else if (seat.type === "AISLE") {
                              cellClass +=
                                "border border-dashed border-zinc-700 text-zinc-600 hover:border-zinc-500";
                            } else if (seat.type === "VIP") {
                              cellClass +=
                                "bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30";
                            } else if (seat.type === "WHEELCHAIR") {
                              cellClass +=
                                "bg-sky-500/20 text-sky-300 border border-sky-500/50 hover:bg-sky-500/30";
                            } else {
                              cellClass +=
                                "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-primary";
                            }

                            return (
                              <div
                                key={seat.id}
                                onClick={() => toggleGridSeat(seat.id)}
                                className={cellClass}
                                title={`${seat.rowLabel}${seat.seatNumber} · ${
                                  seat.status === "BROKEN" ? "BROKEN (Maintenance)" : seat.type
                                } (Click to paint)`}
                              >
                                {seat.status === "BROKEN"
                                  ? "✕"
                                  : seat.type === "AISLE"
                                  ? "-"
                                  : seat.type === "VIP"
                                  ? "V"
                                  : seat.type === "WHEELCHAIR"
                                  ? "♿"
                                  : seat.seatNumber}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SHOWTIMES & PRICING */}
      {/* ========================================================================= */}
      {activeTab === "showtimes" && (
        <div className="mt-8 rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Showtimes & Base Pricing</h2>
              <p className="text-xs text-muted-foreground">
                Manage schedule slots, audio formats, and ticket pricing across cinema halls.
              </p>
            </div>
            <button
              onClick={() => setShowAddShowtimeModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule Showtime Slot</span>
            </button>
          </div>

          {showtimesLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-xs text-muted-foreground">Loading showtimes from database...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-muted-foreground">
                <thead className="border-b border-border bg-background/50 uppercase text-[10px] text-white">
                  <tr>
                    <th className="p-3">Movie</th>
                    <th className="p-3">Hall</th>
                    <th className="p-3">Date & Time</th>
                    <th className="p-3">Format & Audio</th>
                    <th className="p-3">Base Price</th>
                    <th className="p-3">Tickets Sold</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {showtimesList.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/20 transition">
                      <td className="p-3 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <img
                            src={s.posterUrl}
                            alt={s.movieTitle}
                            className="h-9 w-6 rounded object-cover border border-border"
                          />
                          <span>{s.movieTitle}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-white font-medium">{s.hallName}</div>
                        <div className="text-[10px] text-muted-foreground">{s.cinemaName}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-white">
                          {new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(s.startTime).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="rounded bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-bold mr-1">
                          {s.format}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{s.audioLanguage}</span>
                      </td>
                      <td className="p-3 font-bold text-primary">{formatPrice(s.basePrice)}</td>
                      <td className="p-3 font-semibold text-white">
                        {s.ticketsSold} / {s.capacity}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteShowtime(s.id, s.movieTitle)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/20 hover:text-rose-400 transition"
                          title="Cancel/Delete Showtime"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add Showtime Modal */}
          {showAddShowtimeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-base font-bold text-white">Schedule New Screening</h3>
                  <button
                    onClick={() => setShowAddShowtimeModal(false)}
                    className="text-muted-foreground hover:text-white text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleCreateShowtime} className="space-y-3 text-xs">
                  <div>
                    <label className="text-muted-foreground block mb-1">Movie *</label>
                    <select
                      required
                      value={newShowtimeForm.movieId}
                      onChange={(e) => setNewShowtimeForm({ ...newShowtimeForm, movieId: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-white focus:border-primary focus:outline-none"
                    >
                      <option value="">Select a movie...</option>
                      {moviesList.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title} ({m.durationMin} min)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-muted-foreground block mb-1">Salle (Hall) *</label>
                    <select
                      required
                      value={newShowtimeForm.hallId}
                      onChange={(e) => setNewShowtimeForm({ ...newShowtimeForm, hallId: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-white focus:border-primary focus:outline-none"
                    >
                      <option value="">Select a hall...</option>
                      {hallsList.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} · {h.type} ({h.capacity} seats)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-muted-foreground block mb-1">Start Date & Time *</label>
                    <input
                      required
                      type="datetime-local"
                      value={newShowtimeForm.startTime}
                      onChange={(e) => setNewShowtimeForm({ ...newShowtimeForm, startTime: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-white focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-muted-foreground block mb-1">Base Price (MAD)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={newShowtimeForm.basePrice}
                        onChange={(e) =>
                          setNewShowtimeForm({ ...newShowtimeForm, basePrice: Number(e.target.value) })
                        }
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-white focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-muted-foreground block mb-1">Format</label>
                      <select
                        value={newShowtimeForm.format}
                        onChange={(e) => setNewShowtimeForm({ ...newShowtimeForm, format: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-white focus:border-primary focus:outline-none"
                      >
                        <option value="TWO_D">2D Standard</option>
                        <option value="THREE_D">3D RealD</option>
                        <option value="IMAX_2D">IMAX 2D</option>
                        <option value="IMAX_3D">IMAX 3D</option>
                        <option value="FOUR_DX">4DX Experience</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setShowAddShowtimeModal(false)}
                      className="rounded-xl border border-border px-4 py-2 text-muted-foreground hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-primary px-5 py-2 font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary/90"
                    >
                      Schedule
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: USERS & ROLE MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === "users" && (
        <div className="mt-8 rounded-3xl border border-border bg-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Registered Users & Role Assignment</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Assign administrative, staff gatekeeper, or customer roles across CinePath accounts.
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

      {/* ========================================================================= */}
      {/* TAB 6: AUDIT & SECURITY ANOMALY LOGS */}
      {/* ========================================================================= */}
      {activeTab === "logs" && (
        <div className="mt-8 rounded-3xl border border-border bg-card p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Security Anomalies & System Audit Trail</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Immutable records of turnstile gate scans, QR code verification, seat maintenance, and administrative modifications.
              </p>
            </div>

            {/* Severity Filter Pills & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl bg-background border border-border p-0.5 text-xs font-semibold">
                <button
                  onClick={() => {
                    setLogSeverity("ALL");
                    setTimeout(fetchLogs, 50);
                  }}
                  className={`px-3 py-1 rounded-lg transition ${
                    logSeverity === "ALL" ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
                  }`}
                >
                  All ({logsList.length})
                </button>
                <button
                  onClick={() => {
                    setLogSeverity("CRITICAL");
                    setTimeout(fetchLogs, 50);
                  }}
                  className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                    logSeverity === "CRITICAL"
                      ? "bg-rose-600 text-white"
                      : "text-rose-400 hover:text-rose-300"
                  }`}
                >
                  <AlertOctagon className="h-3 w-3" />
                  <span>Critical ({logSummary.critical})</span>
                </button>
                <button
                  onClick={() => {
                    setLogSeverity("WARN");
                    setTimeout(fetchLogs, 50);
                  }}
                  className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                    logSeverity === "WARN"
                      ? "bg-amber-600 text-white"
                      : "text-amber-400 hover:text-amber-300"
                  }`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  <span>Warnings ({logSummary.warn})</span>
                </button>
                <button
                  onClick={() => {
                    setLogSeverity("INFO");
                    setTimeout(fetchLogs, 50);
                  }}
                  className={`px-3 py-1 rounded-lg transition ${
                    logSeverity === "INFO" ? "bg-zinc-700 text-white" : "text-muted-foreground hover:text-white"
                  }`}
                >
                  Info ({logSummary.info})
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter logs..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
                  className="rounded-xl border border-border bg-background pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none w-44"
                />
              </div>

              <button
                onClick={fetchLogs}
                disabled={logsLoading}
                className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition flex items-center gap-1"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${logsLoading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {logsLoading && logsList.length === 0 ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-xs text-muted-foreground">Loading audit records from PostgreSQL...</p>
            </div>
          ) : logsList.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No audit logs recorded for the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-muted-foreground">
                <thead className="border-b border-border bg-background/50 uppercase text-[10px] text-white">
                  <tr>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Actor / Source</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Entity</th>
                    <th className="p-3">Description & Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {logsList.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    return (
                      <tr key={log.id} className="hover:bg-muted/20 transition">
                        <td className="p-3">
                          {log.severity === "CRITICAL" ? (
                            <span className="inline-flex items-center gap-1 rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-extrabold text-rose-400 border border-rose-500/40">
                              <AlertOctagon className="h-3 w-3" /> CRITICAL
                            </span>
                          ) : log.severity === "WARN" ? (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-300 border border-amber-500/40">
                              <AlertTriangle className="h-3 w-3" /> WARN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-400 border border-sky-500/20">
                              <Info className="h-3 w-3" /> INFO
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-white whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-white truncate max-w-[140px]">
                            {log.actorEmail || "SYSTEM"}
                          </div>
                          <span className="text-[10px] text-muted-foreground uppercase font-mono">
                            {log.actorRole || "DAEMON"}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] font-bold text-primary">
                          {log.action}
                        </td>
                        <td className="p-3">
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            {log.entityType}
                          </span>
                          {log.entityId && (
                            <span className="ml-1 text-[10px] font-mono text-muted-foreground truncate">
                              #{log.entityId.slice(0, 8)}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="text-white text-xs">{log.message}</div>
                          {log.metadata && (
                            <div className="mt-1">
                              <button
                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                className="text-[10px] text-primary hover:underline"
                              >
                                {isExpanded ? "Hide Metadata" : "View Metadata Payload"}
                              </button>
                              {isExpanded && (
                                <pre className="mt-1.5 rounded-lg bg-black/60 p-2 font-mono text-[10px] text-emerald-400 overflow-x-auto border border-border">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
