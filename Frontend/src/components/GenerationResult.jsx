

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/react";
import {
  Download,
  RefreshCw,
  Share2,
  Play,
  Video,
  LoaderCircle,
  ArrowLeft,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function GenerationResult({ generation: initialGeneration, onNewGeneration }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [generation, setGeneration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [error, setError] = useState("");
  const [videoError, setVideoError] = useState("");
  const [videoCreditsExhausted, setVideoCreditsExhausted] = useState(false);
  const [creditBalance, setCreditBalance] = useState({ image: null, video: null });

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;

    async function loadCreditBalance() {
      try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/api/credits/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok || !data.success) return;
        if (!cancelled) {
          setCreditBalance({
            image: data.account.imageCredits,
            video: data.account.videoCredits,
          });
        }
      } catch (balanceError) {
        console.error("Unable to refresh credit balance:", balanceError);
      }
    }

    loadCreditBalance();
    return () => { cancelled = true; };
  }, [getToken, isLoaded, isSignedIn]);

  useEffect(() => {
    if (initialGeneration?.remainingImageCredits !== undefined) {
      setCreditBalance((current) => ({
        ...current,
        image: initialGeneration.remainingImageCredits,
      }));
    }
  }, [initialGeneration]);

  useEffect(() => {
    if (initialGeneration) {
      setGeneration(initialGeneration);
      setLoading(false);
      setError("");
      return;
    }

    if (!id) {
      setError("No generation ID was provided.");
      setLoading(false);
      return;
    }

    if (!isLoaded) return;

    if (!isSignedIn) {
      setError("Please sign in to view this generation.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchGeneration() {
      try {
        setLoading(true);
        setError("");

        const token = await getToken();

        const [generationResponse, videosResponse] = await Promise.all([
          fetch(`${API_URL}/api/create/generations`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/videos/generated-videos`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!generationResponse.ok) {
          throw new Error("Failed to fetch your generations.");
        }

        const data = await generationResponse.json();
        const generations = Array.isArray(data)
          ? data
          : data.generations || data.data || [];

        const selected = generations.find(
          (item) => String(item._id) === id
        );
         if (!selected) {
          throw new Error("Generation not found.");
        }
        // Use the video URL already saved on this generation, if available.
        let updatedGeneration = selected;

        if (videosResponse.ok) {
          const videoData = await videosResponse.json();
          const videos = Array.isArray(videoData)
            ? videoData
            : videoData.videos || videoData.generations || [];

          const matchingVideo = videos.find(
            (item) => String(item._id) === id
          );

          if (matchingVideo?.generatedVideoUrl) {
            updatedGeneration = {
              ...selected,
              generatedVideoUrl: matchingVideo.generatedVideoUrl,
            };
          }
        }

        if (!cancelled) {
          setGeneration(updatedGeneration);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load generation.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchGeneration();

    return () => {
      cancelled = true;
    };
  }, [id, initialGeneration, getToken, isLoaded, isSignedIn]);

  const handleGenerateVideo = async () => {
    try {
      setGeneratingVideo(true);
      setVideoError("");
      setVideoCreditsExhausted(false);

      const token = await getToken();
      console.log("Clerk token exists:", Boolean(token));
      console.log("Clerk user signed in:", isSignedIn);
      if (!token) {
      throw new Error("Unable to retrieve your session token. Please try again.");
    }
    
      const response = await fetch(`${API_URL}/api/videos/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ generationId: generation?._id || id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const requestError = new Error(data.message || "Failed to generate video.");
        requestError.code = data.code;
        throw requestError;
      }

      // Support either a direct URL or a generation object in the response.
      const videoUrl =
        data.generatedVideoUrl ||
        data.generation?.generatedVideoUrl ||
        data.video?.generatedVideoUrl;

      if (!videoUrl) {
        throw new Error(
          "Video generation completed, but no video URL was returned."
        );
      }

      setGeneration((previous) => ({
        ...previous,
        generatedVideoUrl: videoUrl,
      }));
      if (data.remainingVideoCredits !== undefined) {
        setCreditBalance((current) => ({
          ...current,
          video: data.remainingVideoCredits,
        }));
      }
    } catch (err) {
      setVideoError(err.message || "Unable to generate video.");
      setVideoCreditsExhausted(err.code === "NO_VIDEO_CREDITS");
    } finally {
      setGeneratingVideo(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Result link copied to clipboard!");
    } catch {
      setVideoError("Unable to copy the result link.");
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050711] text-white">
        <LoaderCircle className="mr-3 animate-spin" size={22} />
        Loading your generated advertisement...
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#050711] p-6 text-white">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => onNewGeneration ? onNewGeneration() : navigate("/create")}
          className="rounded-xl bg-indigo-600 px-5 py-3"
        >
          Back to Create
        </button>
      </main>
    );
  }

  const imageUrl = generation?.generatedImageUrl;
  const videoUrl = generation?.generatedVideoUrl;

  return (
    <main className="min-h-screen bg-[#050711] px-5 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNewGeneration ? onNewGeneration() : navigate("/create")}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Back to create"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Generation Result
            </h1>
          </div>

          <button
            onClick={() => onNewGeneration ? onNewGeneration() : navigate("/create")}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/15 sm:px-6"
          >
            <RefreshCw size={16} />
            <span>New Generation</span>
          </button>
        </header>

        <section className="mb-6 grid gap-3 sm:grid-cols-2" aria-live="polite">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
            <span className="text-slate-400">Image credits remaining: </span>
            <strong>{creditBalance.image ?? "Loading…"}</strong>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
            <span className="text-slate-400">Video credits remaining: </span>
            <strong>{creditBalance.video ?? "Loading…"}</strong>
          </div>
        </section>

        {/* Main content */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.8fr)_minmax(300px,0.9fr)]">
          {/* Image / video preview */}
          <section className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.05] p-2">
            <div className="flex min-h-[300px] items-center justify-center overflow-hidden rounded-xl bg-black/20 sm:min-h-[450px] lg:min-h-[490px]">
              {videoUrl ? (
                <video
                  key={videoUrl}
                  src={videoUrl}
                  controls
                  playsInline
                  className="max-h-[700px] w-full rounded-xl object-contain"
                >
                  Your browser does not support video playback.
                </video>
              ) : imageUrl ? (
                <img
                  src={imageUrl}
                  alt={generation.title || "Generated advertisement"}
                  className="max-h-[700px] w-full rounded-xl object-contain"
                />
              ) : (
                <p className="p-8 text-center text-amber-300">
                  No generated image URL was saved for this generation.
                </p>
              )}
            </div>
          </section>

          {/* Actions */}
          <aside className="flex flex-col gap-6">
            <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-6">
              <h2 className="mb-4 text-xl font-bold">Actions</h2>

              {imageUrl && (
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/15 px-4 py-4 text-sm font-semibold transition hover:bg-white/20"
                >
                  <Download size={17} />
                  Download Image
                </a>
              )}

              {videoUrl && (
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/15 px-4 py-4 text-sm font-semibold transition hover:bg-white/20"
                >
                  <Download size={17} />
                  Download Video
                </a>
              )}

              <button
                onClick={handleShare}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/15 px-4 py-4 text-sm font-semibold transition hover:bg-white/20"
              >
                <Share2 size={17} />
                Share Result
              </button>
            </section>

            {/* Video Magic */}
            <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#17152b] to-[#30113b] p-6">
              <Video
                size={58}
                className="pointer-events-none absolute right-5 top-8 text-white/10"
              />

              <h2 className="relative text-xl font-bold">Video Magic</h2>

              <p className="relative mt-2 max-w-xs text-sm leading-6 text-slate-400">
                Turn this static image into a dynamic video for social media.
              </p>

              {videoUrl ? (
                <div className="mt-6 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300">
                  Your video has been generated successfully.
                </div>
              ) : (
                <button
                  onClick={handleGenerateVideo}
                  disabled={generatingVideo || !imageUrl}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generatingVideo ? (
                    <>
                      <LoaderCircle size={17} className="animate-spin" />
                      Generating Video...
                    </>
                  ) : (
                    <>
                      <Play size={17} fill="currentColor" />
                      Generate Video
                    </>
                  )}
                </button>
              )}

              {videoError && (
                <div className="mt-4 text-sm leading-5 text-red-300">
                  <p>{videoError}</p>
                  {videoCreditsExhausted && (
                    <button
                      type="button"
                      onClick={() => navigate("/plans")}
                      className="mt-3 rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-500"
                    >
                      Get More Credits
                    </button>
                  )}
                </div>
              )}
            </section>

            {generation.prompt && (
              <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-6">
                <h2 className="font-bold">Your Prompt</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                  {generation.prompt}
                </p>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
