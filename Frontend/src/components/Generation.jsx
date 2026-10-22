
import { useState, useCallback, useEffect } from "react";
// import {Link} from "react-router-dom";
import { Eye, Image as ImageIcon, Video, Clock, Link, AlertCircle } from "lucide-react";
import { useAuth } from "@clerk/react";
const API_URL = import.meta.env.VITE_API_URL;
const filters = [
  {label: "All", value: "all"},
  {label: "Images", value: "image"},
  {label: "Videos", value: "video"},
  {label: "Completed", value: "completed"},
  {label: "Processing", value: "processing"},
  {label: "Failed", value:"failed"},
]
function getStatusClass(status) {
  switch (status) {
    case "completed":
      return "bg-emerald-500/15 text-emerald-400";
    case "processing":
    case "queued":
      return "bg-amber-500/15 text-amber-400";
    case "failed":
      return "bg-red-500/15 text-red-400";
    default:
      return "bg-slate-500/15 text-slate-300";
  }
}
const getMediaUrl = (item) =>
  item.generatedVideoUrl || item.generatedImageUrl || "";

const isVideoGeneration = (item) =>
  item.type === "video" || Boolean(item.generatedVideoUrl);

function getDisplayType(item) {
  // Supports older records with a generated video URL but no type.
  return item.type === "video" || item.generatedVideoUrl
    ? "video"
    : "image";
}

export default function Generation() {
  const {isLoaded, isSignedIn, getToken} = useAuth();
  const [generations, setGenerations] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const fetchGenerations = useCallback(async () => {
    if(!isLoaded) return;
    if(!isSignedIn){
      setGenerations([]);
      setError("Please sign in to view your generations.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/create/generations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if(!response.ok || !data.success){
        throw new Error("Failed to load generations" || data.message);
      }
      setGenerations(Array.isArray(data.generations) ? data.generations : []);
    }
    catch(error){
      setError(error.message || "Unable to load generations.");
    }
    finally {
      setLoading(false);
    }
  }, [getToken, isLoaded, isSignedIn]);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  const filteredGenerations = generations.filter((item) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "image" || activeFilter === "video") {
      return getDisplayType(item) === activeFilter;
    }
    return item.status === activeFilter;
  });

  const completedCount = generations.filter(
    (item) => item.status === "completed"
  ).length;

  return (
    <main className="min-h-screen bg-[#050713] px-5 pb-12 pt-24 sm:px-8 sm:pt-14 mt-15">
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-purple-700/15 blur-[130px]" />
      <div className="pointer-events-none absolute right-0 top-[40%] h-96 w-96 rounded-full bg-fuchsia-700/10 blur-[130px]" />

      <section className="relative z-10 mx-auto max-w-6xl">
        {/* Page heading */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              My Generations
            </h1>
            <p className="mt-3 text-sm text-gray-400 sm:text-base">
              View and manage your AI-generated content
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/15 text-purple-300">
              <ImageIcon size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-400">Total generations</p>
              <p className="text-xl font-semibold text-white">
                {generations.length}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-7 flex flex-wrap items-center gap-2">
          {filters.map(
            (item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setActiveFilter(item.value)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  activeFilter === item.value
                    ? "border-purple-500 bg-purple-600 text-white"
                    : "border-white/10 bg-white/[0.03] text-gray-400 hover:border-purple-400/50 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            )
          )}
        </div>

         {loading && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]"
              >
                <div className="aspect-[4/3] bg-white/10" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-2/3 rounded bg-white/10" />
                  <div className="h-3 w-1/3 rounded bg-white/10" />
                  <div className="h-9 rounded-lg bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
            <button
              onClick={fetchGenerations}
              className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Masonry-style generation gallery */}
        {!loading && !error && filteredGenerations.length > 0 && (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {filteredGenerations.map((item) => {
              const type = getDisplayType(item);
              const mediaUrl = getMediaUrl(item);
              const isVideoUrl = isVideoGeneration(item);
              return (
              <article
                key={item.id}
                className="mb-4 break-inside-avoid overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-purple-950/70 to-[#11121f] transition duration-300 hover:-translate-y-1 hover:border-purple-500/50"
              >
                <div className="group relative overflow-hidden bg-[#151522]">
                  {mediaUrl && type === "image" ? (
                  <img
                    src={mediaUrl}
                    alt={item.title}
                    loading="lazy"
                    className="block h-auto max-h-[520px] min-h-[190px] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  ) : mediaUrl && type === "video" ? (
                    <video
                    src={mediaUrl}
                        controls
                        preload="metadata"
                        className="h-full w-full object-cover"
                    />
                  ): (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
                        {type === "video" ? (
                          <Video size={36} />
                        ) : (
                          <ImageIcon size={36} />
                        )}
                        <span className="text-sm">
                          {item.status === "failed"
                            ? "Generation failed"
                            : "Media not available yet"}
                        </span>
                      </div>
                  )}
                   <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white">
                      {type === "video" ? (
                        <Video size={13} />
                      ) : (
                        <ImageIcon size={13} />
                      )}
                      {type === "video" ? "Video" : "Image"}
                    </span>
                    </div>

                    <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="min-w-0 truncate text-sm font-semibold sm:text-base">
                        {item.title || "Untitled Advertisement"}
                      </h2>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium capitalize ${getStatusClass(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                      <Clock size={13} />
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "Date unavailable"}
                    </p>

                    <Link to={`/generation/${item._id}`}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                    >
                      <Eye size={15} />
                      View Details
                    </Link>
                </div>
              </article>
            );
})};
          </div>
        )}

         {!loading && !error && filteredGenerations.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-16 text-center">
            <ImageIcon
              size={42}
              className="mx-auto text-slate-500"
            />

            <h2 className="mt-4 text-xl font-semibold">
              {generations.length === 0
                ? "No generations yet"
                : "No matching generations"}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              {generations.length === 0
                ? "Your generated images and videos will appear here."
                : "Try selecting a different filter."}
            </p>

            <Link
              to="/create"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-purple-600 px-5 py-3 text-sm font-semibold hover:bg-purple-500"
            >
              <RefreshCw size={16} />
              Create Advertisement
            </Link>
          </div>
        )}
        </section>
    </main>
      )
}
