import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { Link, Navigate } from "react-router-dom";
import { LoaderCircle, ShieldAlert } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3007";

export function AdminDashboard() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function loadRequests() {
      try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/api/admin/purchase-requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load admin dashboard.");
        }
        if (!cancelled) setRequests(data.purchaseRequests || []);
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || "Unable to load admin dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRequests();
    return () => { cancelled = true; };
  }, [getToken, isLoaded, isSignedIn]);

  if (isLoaded && !isSignedIn) return <Navigate to="/admin-login" replace />;

  return (
    <main className="min-h-screen bg-[#080811] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link to="/" className="text-sm text-slate-400 hover:text-white">← Home</Link>
        <header className="mb-8 mt-6">
          <p className="text-sm text-violet-300">Administration</p>
          <h1 className="mt-2 text-3xl font-bold">Purchase requests</h1>
          <p className="mt-2 text-slate-400">Review subscriber requests and verify payment manually.</p>
        </header>

        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-slate-300">
            <LoaderCircle size={20} className="animate-spin" /> Loading purchase requests...
          </div>
        ) : error ? (
          <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-200">
            <ShieldAlert size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Admin access could not be verified</p>
              <p className="mt-1 text-sm">{error}</p>
              {error.includes("Admin access required") && (
                <p className="mt-2 text-sm">Add your Clerk user ID to <code>ADMIN_CLERK_USER_IDS</code> in the backend environment and restart the server.</p>
              )}
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-slate-300">No purchase requests yet.</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04]">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="border-b border-white/10 text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-medium">Subscriber (Clerk ID)</th>
                  <th className="px-5 py-4 font-medium">Plan</th>
                  <th className="px-5 py-4 font-medium">Credits requested</th>
                  <th className="px-5 py-4 font-medium">Amount</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {requests.map((request) => (
                  <tr key={request.requestId}>
                    <td className="px-5 py-4 font-mono text-xs">{request.clerkUserId}</td>
                    <td className="px-5 py-4 capitalize">{request.plan}</td>
                    <td className="px-5 py-4">{request.imageCredits} images · {request.videoCredits} videos</td>
                    <td className="px-5 py-4">₹{Number(request.amountRupees).toLocaleString("en-IN")}</td>
                    <td className="px-5 py-4 capitalize">{request.status}</td>
                    <td className="px-5 py-4 text-slate-400">{request.createdAt ? new Date(request.createdAt).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
