import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Home from "../../app/ui/home";
import Menu from "../../app/ui/menu";
import Order from "../../app/ui/order";
import Booking from "../../app/ui/booking";
import { routeFromHash } from "./routes";

function LocalPreview() {
  const [route, setRoute] = useState(() => routeFromHash(window.location.hash));
  useEffect(() => {
    const navigate = () => setRoute(routeFromHash(window.location.hash));
    const closeDialog = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.("a");
      if (link?.getAttribute("href")?.startsWith("#/")) {
        document.querySelectorAll<HTMLDialogElement>("dialog[open]").forEach(dialog => dialog.close());
        if (link.hash === window.location.hash) navigate();
      }
    };
    window.addEventListener("hashchange", navigate);
    document.addEventListener("click", closeDialog);
    return () => { window.removeEventListener("hashchange", navigate); document.removeEventListener("click", closeDialog); };
  }, []);
  useEffect(() => {
    const titles: Record<string, string> = { "/": "Global Herbs · Restaurant & Bar", "/menu": "Food & drinks · Global Herbs", "/order": "Order takeaway · Global Herbs", "/book": "Book a table · Global Herbs" };
    document.title = `${titles[route.pathname] ?? titles["/"]} · Local preview`;
    const frame = requestAnimationFrame(() => {
      if (route.hash) {
        document.getElementById(decodeURIComponent(route.hash.slice(1)))?.scrollIntoView({ block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "instant" });
        document.getElementById("main")?.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [route]);
  const Page = route.pathname === "/menu" ? Menu : route.pathname === "/order" ? Order : route.pathname === "/book" ? Booking : Home;
  return <Page key={route.pathname + route.search} />;
}

createRoot(document.getElementById("root")!).render(<LocalPreview />);
