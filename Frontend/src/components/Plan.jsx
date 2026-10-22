import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, CreditCard, Image as ImageIcon, LoaderCircle, QrCode, Sparkles, Video } from "lucide-react";
import { useAuth } from "@clerk/react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3007";

const plans = [
  {
    id: "basic",
    name: "Basic",
    imageCredits: 10,
    videoCredits: 10,
    price: 200,
    description: "A small top-up for your next campaign.",
  },
  {
    id: "premium",
    name: "Premium",
    imageCredits: 50,
    videoCredits: 50,
    price: 1000,
    description: "More credits for frequent ad creation.",
    featured: true,
  },
];

export function Plan() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("basic");
  const [customImages, setCustomImages] = useState(10);
  const [customVideos, setCustomVideos] = useState(10);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [purchaseRequest, setPurchaseRequest] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      setError("Sign in to view plans and your credit balance.");
      return;
    }

    let cancelled = false;
    async function loadAccount() {
      try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/api/credits/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load your credit account.");
        }
        if (!cancelled) {
          setAccount(data.account);
          setPaymentDetails(data.paymentDetails || null);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || "Unable to load plans.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAccount();
    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn]);

  const selected = useMemo(() => {
    if (selectedPlan === "custom") {
      const imageCredits = Math.max(0, Number(customImages) || 0);
      const videoCredits = Math.max(0, Number(customVideos) || 0);
      return {
        id: "custom",
        name: "Custom",
        imageCredits,
        videoCredits,
        price: (imageCredits + videoCredits) * 10,
      };
    }
    return plans.find((plan) => plan.id === selectedPlan) || plans[0];
  }, [customImages, customVideos, selectedPlan]);

  const paymentUri = useMemo(() => {
    if (!paymentDetails?.upiVpa || !paymentDetails?.payeeName || !purchaseRequest) return "";
    const params = new URLSearchParams({
      pa: paymentDetails.upiVpa,
      pn: paymentDetails.payeeName,
      am: String(purchaseRequest.amountRupees),
      cu: "INR",
      tn: `Credit purchase ${purchaseRequest.requestId}`,
    });
    return `upi://pay?${params.toString()}`;
  }, [paymentDetails, purchaseRequest]);

  async function handlePurchaseRequest() {
    try {
      setBusy(true);
      setError("");
      setMessage("");
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/credits/purchase-request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageId: selected.id,
          ...(selected.id === "custom" && {
            imageCredits: selected.imageCredits,
            videoCredits: selected.videoCredits,
          }),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to create purchase request.");
      }
      setPurchaseRequest(data.purchaseRequest);
      setMessage(data.message);
    } catch (purchaseError) {
      setError(purchaseError.message || "Unable to create purchase request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080811] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link to="/loginHomePage" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft size={17} /> Dashboard
        </Link>

        <header className="mb-8 mt-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-sm text-violet-200">
            <Sparkles size={15} /> Plans & credits
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">Choose your credit pack</h1>
          <p className="mt-3 max-w-2xl text-slate-400">
            Each image or video uses one matching credit. Demo pricing is ₹10 per credit.
            No real payment is collected on this page.
          </p>
        </header>

        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-slate-300">
            <LoaderCircle size={20} className="animate-spin" /> Loading plans...
          </div>
        ) : error && !account ? (
          <div role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-200">{error}</div>
        ) : !isSignedIn ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-slate-300">
            {error || "Please sign in to continue."}
            <Link to="/sign-in" className="ml-2 text-violet-300 underline">Sign in</Link>
          </div>
        ) : (
          <>
            {account && (
              <section className="mb-7 grid gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:grid-cols-3">
                <div><p className="text-sm text-slate-400">Current plan</p><p className="mt-1 font-semibold capitalize">{account.plan}</p></div>
                <div><p className="text-sm text-slate-400">Image credits</p><p className="mt-1 font-semibold">{account.imageCredits} remaining</p></div>
                <div><p className="text-sm text-slate-400">Video credits</p><p className="mt-1 font-semibold">{account.videoCredits} remaining</p></div>
              </section>
            )}

            <div className="grid gap-5 lg:grid-cols-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => { setSelectedPlan(plan.id); setMessage(""); }}
                  className={`relative rounded-2xl border p-6 text-left transition ${selectedPlan === plan.id ? "border-violet-400 bg-violet-500/10 ring-1 ring-violet-400/40" : "border-white/10 bg-white/[0.03] hover:border-white/20"}`}
                >
                  {plan.featured && <span className="absolute right-5 top-5 rounded-full bg-violet-500/20 px-3 py-1 text-xs text-violet-200">Popular</span>}
                  <p className="text-sm text-slate-400">{plan.name}</p>
                  <p className="mt-3 text-3xl font-bold">₹{plan.price.toLocaleString("en-IN")}</p>
                  <p className="mt-2 min-h-10 text-sm text-slate-400">{plan.description}</p>
                  <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm">
                    <p className="flex items-center gap-2"><ImageIcon size={16} className="text-fuchsia-300" /> {plan.imageCredits} image credits</p>
                    <p className="flex items-center gap-2"><Video size={16} className="text-indigo-300" /> {plan.videoCredits} video credits</p>
                    <p className="flex items-center gap-2 text-slate-400"><Check size={15} /> ₹10 per credit</p>
                  </div>
                </button>
              ))}

              <section className={`rounded-2xl border p-6 ${selectedPlan === "custom" ? "border-violet-400 bg-violet-500/10 ring-1 ring-violet-400/40" : "border-white/10 bg-white/[0.03]"}`}>
                <button type="button" onClick={() => { setSelectedPlan("custom"); setMessage(""); }} className="w-full text-left">
                  <p className="text-sm text-slate-400">Custom</p>
                  <p className="mt-3 text-3xl font-bold">₹{selectedPlan === "custom" ? selected.price.toLocaleString("en-IN") : "—"}</p>
                  <p className="mt-2 text-sm text-slate-400">Choose the number of credits you need.</p>
                </button>
                <div className="mt-5 space-y-4">
                  <label className="block text-sm text-slate-300">Image credits
                    <input type="number" min="0" max="500" value={customImages} onFocus={() => setSelectedPlan("custom")} onChange={(event) => setCustomImages(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-violet-400" />
                  </label>
                  <label className="block text-sm text-slate-300">Video credits
                    <input type="number" min="0" max="500" value={customVideos} onFocus={() => setSelectedPlan("custom")} onChange={(event) => setCustomVideos(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-violet-400" />
                  </label>
                </div>
              </section>
            </div>

            <section className="mt-8 grid gap-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="text-xl font-bold">Request a credit purchase</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Selected: {selected.name} · {selected.imageCredits} image + {selected.videoCredits} video credits · ₹{selected.price.toLocaleString("en-IN")}
                </p>
                <p className="mt-3 max-w-xl text-xs leading-5 text-slate-300">
                  Creating a request does not add credits. Credits should only be added after an administrator confirms the payment.
                </p>
                {message && <p role="status" className="mt-4 text-sm text-emerald-300">{message}</p>}
                {error && account && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
                {purchaseRequest && (
                  <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100">
                    <p className="font-semibold">Request pending: {purchaseRequest.requestId}</p>
                    <p className="mt-1">No credits have been added. Contact the administrator after payment to request verification.</p>
                  </div>
                )}
                <button
                  type="button"
                  disabled={busy || selected.price <= 0 || (selected.id === "custom" && (selected.imageCredits > 500 || selected.videoCredits > 500))}
                  onClick={handlePurchaseRequest}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? <LoaderCircle size={17} className="animate-spin" /> : <CreditCard size={17} />}
                  {busy ? "Creating request..." : "Create purchase request"}
                </button>
              </div>

              <div className="mx-auto w-56 rounded-2xl border border-white/10 bg-[#10101a] p-5 text-center">
                <QrCode size={32} className="mx-auto text-violet-300" />
                <p className="mt-3 text-sm font-semibold text-slate-200">UPI QR payment</p>
                {paymentUri ? (
                  <>
                    <div className="mx-auto mt-4 inline-block rounded-lg bg-white p-2">
                      <QRCodeSVG value={paymentUri} size={176} level="M" includeMargin />
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-400">
                      Scan to pay ₹{purchaseRequest.amountRupees} to {paymentDetails.payeeName}. Credits remain pending until payment is manually verified.
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    {purchaseRequest
                      ? "Set a valid UPI_VPA and UPI_PAYEE_NAME in the backend .env to display the payment QR."
                      : "Create a purchase request to prepare its payment QR. A valid UPI VPA and payee name must be configured."}
                  </p>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
