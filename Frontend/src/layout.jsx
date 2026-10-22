import { Outlet } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";

export function Layout() {
  return (
    <>
      <Navbar />
      <main>
      <Outlet />
      </main>
      <Footer />
    </>
  );
}