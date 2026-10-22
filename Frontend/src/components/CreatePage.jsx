
import { useEffect, useState } from "react";
import { Upload, WandSparkles, X, ImagePlus } from "lucide-react";
import { useAuth } from "@clerk/react";
import { Link } from "react-router-dom";
import GeneratedResult from "../components/GenerationResult";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3007";

const ImageUploadCard = ({
  title,
  file,
  onChange,
  onRemove,
  inputId,
}) => {
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className="relative flex min-h-[255px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-purple-500/40 bg-purple-950/30 p-6 transition hover:border-purple-400 hover:bg-purple-900/30 sm:min-h-[255px]">
      {preview ? (
        <>
          <img
            src={preview}
            alt={title}
            className="absolute inset-0 h-full w-full object-contain p-4"
          />

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/75 px-4 py-3">
            <p className="max-w-[75%] truncate text-sm text-white">
              {file.name}
            </p>

            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${title}`}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-red-500/80"
            >
              <X size={18} />
            </button>
          </div>
        </>
      ) : (
        <label
          htmlFor={inputId}
          className="flex w-full cursor-pointer flex-col items-center text-center"
        >
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/15 text-purple-300">
            <Upload size={30} />
          </div>

          <h3 className="text-lg font-semibold text-white">{title}</h3>

          <p className="mt-2 text-sm text-gray-400">
            Drag & drop or click to upload
          </p>

          <p className="mt-2 text-xs text-gray-500">
            PNG, JPG or WEBP
          </p>
        </label>
      )}

      <input
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          const selectedFile = event.target.files?.[0];

          if (selectedFile) {
            onChange(selectedFile);
          }

          event.target.value = "";
        }}
      />
    </div>
  );
};

export function Create() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [productImage, setProductImage] = useState(null);
  const [modelImage, setModelImage] = useState(null);
  const [generatedResult, setGeneratedResult] = useState(null);

  // These values are sent to your backend.
  const [title, setTitle] = useState("My Product Advertisement");
  const [prompt, setPrompt] = useState(
    "Create a professional product advertisement with cinematic lighting"
  );
  const [adStyle, setAdStyle] = useState("realistic");
  const [duration, setDuration] = useState("10");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [creditLimitReached, setCreditLimitReached] = useState(false);
  const [success, setSuccess] = useState("");
  const [generation, setGeneration] = useState(null);

  const handleGenerateImage = async () => {
    setError("");
    setCreditLimitReached(false);
    setSuccess("");
    setGeneration(null);

    if (!isLoaded) {
      setError("Please wait while authentication loads.");
      return;
    }

    if (!isSignedIn) {
      setError("Please sign in before creating an advertisement.");
      return;
    }

    if (!productImage || !modelImage) {
      setError("Please upload both the product image and model image.");
      return;
    }

    if (
      productImage.size > 10 * 1024 * 1024 ||
      modelImage.size > 10 * 1024 * 1024
    ) {
      setError("Each image must be smaller than 10 MB.");
      return;
    }

    if (!title.trim() || !prompt.trim()) {
      setError("Please enter an advertisement title and prompt.");
      return;
    }

    setLoading(true);

    try {
      // Get the current user's Clerk session token.
      const token = await getToken();

      if (!token) {
        throw new Error(
          "Your session token could not be retrieved. Please sign in again."
        );
      }

      // Send the files and form values as multipart/form-data.
      const formData = new FormData();

      formData.append("title", title.trim());
      formData.append("prompt", prompt.trim());
      formData.append("adStyle", adStyle);
      formData.append("duration", duration);
      formData.append("productImage", productImage);
      formData.append("modelImage", modelImage);

      const response = await fetch(`${API_URL}/api/create/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const requestError = new Error(
          data.message || "Failed to create the advertisement."
        );
        requestError.code = data.code;
        throw requestError;
      }
      const generated = data.generation;
if (!generated?._id) {
  throw new Error("The server did not return a generation ID.");
}
      const generatedWithBalance = {
        ...generated,
        remainingImageCredits: data.remainingImageCredits,
      };
      setGeneration(generatedWithBalance);
      setGeneratedResult(generatedWithBalance);
      setSuccess(
        data.message || "Image generated successfully."
      );
    } catch (err) {
      console.error("Advertisement creation failed:", err);
      setCreditLimitReached(err.code === "NO_IMAGE_CREDITS");
      setError(
        err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchGeneration = async (generationId) => {
  if (!generationId) {
    setError("No generation ID available.");
    return;
  }

  try {
    setError("");
  const token = await getToken();
  const response = await fetch(
    `${API_URL}/api/create/generations`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch generations.");
  }

  const currentGeneration = (data.generations || []).find(
    (item) => item._id === generationId
  );

  if (!currentGeneration) {
     throw new Error("Generation not found.");
  }
  setGeneration(currentGeneration);
  setGeneratedResult(currentGeneration);
  setSuccess(
      currentGeneration.status === "completed"
        ? "Image generated successfully."
        : `Generation status: ${currentGeneration.status}`
    );
  }
  catch(error){
    console.error("Failed to refresh generation:", err);
    setError(err.message || "Failed to refresh generation.");
  }
};

if(generatedResult){
  return (
    <GeneratedResult
      generation={generatedResult}
      onNewGeneration={() => {
        setGeneratedResult(null);
        setGeneration(null);
        setError("");
        setSuccess("");
      }}
    />
  );
}

return (
    <main className="min-h-screen bg-[#050713] px-5 pb-20 pt-12 sm:px-8 sm:pt-16 mt-20">
      {/* Purple background glow */}
      <div className="pointer-events-none absolute -left-24 top-24 h-96 w-96 rounded-full bg-purple-700/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-96 w-96 rounded-full bg-fuchsia-700/15 blur-[130px]" />

      <section className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm text-purple-300">
            <ImagePlus size={16} />
            AI-powered ad creation
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Create In-Context Photos
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-gray-400 sm:text-base">
            Upload your model and product images to generate stunning UGC,
            short-form videos and social media posts.
          </p>
        </div>

        {/* Advertisement settings */}
        <div className="mb-8 grid grid-cols-1 gap-5 rounded-2xl border border-purple-500/20 bg-purple-950/20 p-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="ad-title"
              className="mb-2 block text-sm font-medium text-gray-200"
            >
              Advertisement Title
            </label>

            <input
              id="ad-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Summer Product Ad"
              className="w-full rounded-xl border border-purple-500/25 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label
              htmlFor="ad-style"
              className="mb-2 block text-sm font-medium text-gray-200"
            >
              Advertisement Style
            </label>

            <select
              id="ad-style"
              value={adStyle}
              onChange={(event) => setAdStyle(event.target.value)}
              className="w-full rounded-xl border border-purple-500/25 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none focus:border-purple-400"
            >
              <option value="realistic">Realistic</option>
              <option value="cinematic">Cinematic</option>
              <option value="minimal">Minimal</option>
              <option value="luxury">Luxury</option>
              <option value="ugc">UGC</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="ad-duration"
              className="mb-2 block text-sm font-medium text-gray-200"
            >
              Video Duration
            </label>

            <select
              id="ad-duration"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className="w-full rounded-xl border border-purple-500/25 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none focus:border-purple-400"
            >
              <option value="5">5 seconds</option>
              <option value="10">10 seconds</option>
              <option value="15">15 seconds</option>
              <option value="30">30 seconds</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="ad-prompt"
              className="mb-2 block text-sm font-medium text-gray-200"
            >
              Generation Prompt
            </label>

            <textarea
              id="ad-prompt"
              rows={3}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the advertisement you want..."
              className="w-full resize-y rounded-xl border border-purple-500/25 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none focus:border-purple-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <ImageUploadCard
            title="Product Image"
            inputId="product-image"
            file={productImage}
            onChange={setProductImage}
            onRemove={() => setProductImage(null)}
          />

          <ImageUploadCard
            title="Model Image"
            inputId="model-image"
            file={modelImage}
            onChange={setModelImage}
            onRemove={() => setModelImage(null)}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="mx-auto mt-5 max-w-xl rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-200"
          >
            <p>{error}</p>
            {creditLimitReached && (
              <Link to="/plans" className="mt-3 inline-flex rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-500">
                Get More Credits
              </Link>
            )}
          </div>
        )}

        {success && (
          <p
            role="status"
            className="mx-auto mt-5 max-w-xl rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-center text-sm text-green-200"
          >
            {success}
          </p>
        )}

       
       <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={handleGenerateImage}
            disabled={loading || !isLoaded}
            className="inline-flex min-w-[210px] items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <WandSparkles size={19} />
            {loading ? "Generating Image..." : "Generate Image"}
          </button>
          
            <button
    type="button"
    onClick={() => fetchGeneration(generation?._id)}
    disabled={loading || !isLoaded || !generation?._id}
    className="inline-flex items-center justify-center gap-2 rounded-lg border border-purple-500/40 px-6 py-4 text-sm font-semibold text-purple-200 transition hover:bg-purple-500/10 disabled:cursor-not-allowed disabled:opacity-50"
  >
    Refresh Generation
  </button>
        </div>
      </section>
    </main>
  );
} 
