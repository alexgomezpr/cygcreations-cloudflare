import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

/** One-shot reveal, header shrink, and a small desktop parallax. No-ops when motion is reduced.
 * Call from a component inside the page (the header), not the document shell.
 * The shell hydrates first; writing classes from there races the page and warns. */
export function usePageMotion() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const cards = document.querySelectorAll(".reveal-card");
    const others = document.querySelectorAll(".reveal");
    const revealAll = () => {
      cards.forEach((node) => node.classList.add("is-in"));
      others.forEach((node) => node.classList.add("is-in"));
      document.querySelectorAll(".reveal-img").forEach((node) => node.classList.add("is-in"));
    };
    if (reduce) {
      revealAll();
      return;
    }
    const seen = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          seen.unobserve(entry.target);
        }
      },
      { threshold: 0, rootMargin: "0px 0px -10% 0px" },
    );
    cards.forEach((node) => seen.observe(node));
    others.forEach((node) => seen.observe(node));
    const fallback = window.setTimeout(revealAll, 2000);

    let compact = false;
    const onScroll = () => {
      const y = window.scrollY;
      if (!compact && y > 40) compact = true;
      else if (compact && y < 8) compact = false;
      document.querySelector("[data-site-header]")?.classList.toggle("is-compact", compact);
      if (!desktop.matches) return;
      const shift = Math.max(-20, Math.min(20, window.scrollY * 0.05));
      document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((node) => {
        node.style.transform = `translate3d(0, ${shift}px, 0)`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(fallback);
      seen.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);
}
