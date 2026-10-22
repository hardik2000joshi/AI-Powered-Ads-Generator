import { SignIn } from "@clerk/react";
import { Link } from "react-router-dom";

export function AdminLogin() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#0b0b12] p-4 text-white">
      <Link to="/" className="text-sm text-violet-300 hover:text-violet-200">← Back to home</Link>
      <div className="text-center">
        <h1 className="text-2xl font-bold">Administrator sign in</h1>
        <p className="mt-2 max-w-sm text-sm text-slate-400">
          Sign in with the Clerk account configured as an administrator.
        </p>
      </div>
      <SignIn
        routing="path"
        path="/admin-login"
        signUpUrl="/sign-up"
        forceRedirectUrl="/admin"
        fallbackRedirectUrl="/admin"
        appearance={{ elements: { card: "shadow-2xl" } }}
      />
    </main>
  );
}
