import { useEffect, useState } from "react";
import {
  ArrowRight,
  CreditCard,
  History,
  Image as ImageIcon,
  LayoutDashboard,
  LoaderCircle,
  Plus,
  Sparkles,
  Video,
} from "lucide-react";
import { useAuth } from "@clerk/react";
import { Link, NavLink } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3007";

const navigation = [
  { name: "Overview", icon: LayoutDashboard, path: "/loginHomePage", end: true },
  { name: "Create an Ad", icon: Plus, path: "/create" },
  { name: "My Generations", icon: History, path: "/generation" },
  { name: "Plans & Credits", icon: CreditCard, path: "/plans" },
];

function CreditCardView({ title, remaining, total, icon: Icon, color }) {
  const safeRemaining = Number(remaining) || 0;
  const safeTotal = Number(total) || 0;
  const used = Math.max(0, safeTotal - safeRemaining);
  const progress = safeTotal ? Math.min(100, (used / safeTotal) * 100) : 0;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="mt-3 text-3xl font-bold text-white">{safeRemaining}</p>
          <p className="mt-1 text-sm text-slate-500">credits remaining</p>
        </div>
        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={22} />
        </div>
      </div>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-violet-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {used} used out of {safeTotal} granted
      </p>
    </section>
  );
}

export function DashboardSidebar() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setLoading(false);
      setError("Sign in to view your dashboard and credits.");
      return;
    }

    let cancelled = false;

    async function loadCredits() {
      try {
        setLoading(true);
        setError("");
        const token = await getToken();
        const response = await fetch(`${API_URL}/api/credits/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load your credits.");
        }

        if (!cancelled) setAccount(data.account);
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load your credits.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCredits();
    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn]);

  return (
    <div className="min-h-screen bg-[#080811] text-white md:flex">
      <aside className="border-b border-white/10 bg-[#0b0b12] p-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <Link to="/loginHomePage" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600">
            <Sparkles size={21} />
          </div>
          <div>
            <p className="font-bold">AdStudio</p>
            <p className="text-xs text-slate-500">AI Creative Workspace</p>
          </div>
        </Link>

        <nav className="mt-8 grid grid-cols-2 gap-2 md:grid-cols-1">
          {navigation.map(({ name, icon: Icon, path, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                  isActive
                    ? "bg-violet-600 text-white"
                    : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              {name}
            </NavLink>
          ))}
        </nav>

        <div className="mt-8 rounded-2xl border border-violet-500/20 bg-violet-500/[0.07] p-4">
          <p className="text-sm font-semibold">Need more credits?</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            View the demo credit packs. No real payment is made.
          </p>
          <Link
            to="/plans"
            className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-3 py-2.5 text-sm font-semibold hover:bg-violet-500"
          >
            Get More Credits
            <ArrowRight size={16} />
          </Link>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8">
        <header className="mb-8">
          <p className="text-sm text-violet-300">Workspace overview</p>
          <h1 className="mt-2 text-3xl font-bold">Your Dashboard</h1>
          <p className="mt-2 text-slate-400">
            Check your available credits and continue creating ads.
          </p>
        </header>

        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-slate-300">
            <LoaderCircle size={20} className="animate-spin" />
            Loading your credit balances...
          </div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-200">
            {error}
          </div>
        ) : account ? (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div>
                <p className="text-sm text-slate-400">Current plan</p>
                <p className="mt-1 text-lg font-semibold capitalize">{account.plan}</p>
              </div>
              <span className="rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-3 py-1.5 text-xs text-amber-200">
                Demo checkout · no real payment
              </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <CreditCardView
                title="Image credits"
                remaining={account.imageCredits}
                total={account.imageCreditsGranted}
                icon={ImageIcon}
                color="bg-fuchsia-500/10 text-fuchsia-300"
              />
              <CreditCardView
                title="Video credits"
                remaining={account.videoCredits}
                total={account.videoCreditsGranted}
                icon={Video}
                color="bg-indigo-500/10 text-indigo-300"
              />
            </div>

            <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-semibold">Ready to create?</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Image and video generation use their matching credit balance.
                  </p>
                </div>
                <Link
                  to="/create"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold hover:brightness-110"
                >
                  <Plus size={17} />
                  Create an Ad
                </Link>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
