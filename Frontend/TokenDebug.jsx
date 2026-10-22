
import { useAuth } from "@clerk/react";

export default function TokenDebug() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const handleGetToken = async () => {
    try {
      if (!isLoaded || !isSignedIn) {
        alert("Please sign in first.");
        return;
      }

      const token = await getToken();
      console.log("Clerk token:", token);
      if (!token) {
        alert("Clerk did not return a session token.");
        return;
      }

      await navigator.clipboard.writeText(token);
      alert("Clerk session token copied. Paste it into Postman.");
    } catch (error) {
      console.error("Unable to get Clerk token:", error);
      alert("Failed to retrieve the token. Check the console.");
    }
  };

  return (
    <button onClick={handleGetToken}>
      Copy Clerk Session Token
    </button>
  );
}
