import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { usePageMotion } from "@/components/motion";

const links = [
  { href: "/#shop", label: "Shop" },
  { href: "/#gallery", label: "Gallery" },
  { href: "/#about", label: "About" },
  { href: "/#custom", label: "Custom" },
  { href: "/#contact", label: "Contact" },
] as const;

function validHttps(value: string) {
  try {
    return new URL(value).protocol === "https:" ? value : "";
  } catch {
    return "";
  }
}

export function SiteHeader({ donateUrl }: { donateUrl: string }) {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const donate = validHttps(donateUrl);
  usePageMotion();

  useLayoutEffect(() => {
    const root = document.documentElement;
    const measure = () => {
      const banner = document.querySelector<HTMLElement>("[data-created-with-grok-banner]");
      let height = 0;
      let pill = false;
      if (banner) {
        const box = banner.getBoundingClientRect();
        const style = getComputedStyle(banner);
        const shown =
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number.parseFloat(style.opacity || "1") > 0 &&
          box.height > 0;
        if (shown) {
          height = Math.round(box.height);
          pill = box.width < window.innerWidth * 0.9;
        }
      }
      root.style.setProperty("--grok-banner-h", `${height}px`);
      root.classList.toggle("has-grok-pill", pill);
      const header = headerRef.current;
      if (header && !header.classList.contains("is-compact")) {
        root.style.setProperty("--site-header-slot", `${Math.round(header.getBoundingClientRect().height)}px`);
        const bar = header.querySelector(".site-header-bar");
        if (bar) root.style.setProperty("--site-header-h", `${Math.round(bar.getBoundingClientRect().height)}px`);
      }
      if (banner) sizes.observe(banner);
    };
    const mutations = new MutationObserver(measure);
    mutations.observe(document.documentElement, { childList: true, subtree: true });
    const sizes = new ResizeObserver(measure);
    if (headerRef.current) sizes.observe(headerRef.current);
    measure();
    window.addEventListener("resize", measure);
    return () => {
      mutations.disconnect();
      sizes.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <>
      <div className="site-header-slot" />
      <header
        ref={headerRef}
        data-site-header
        className="site-header z-30 border-b border-line bg-paper"
      >
      <div className="site-header-bar mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 flex-1">
          <Link to="/" className="shrink-0" onClick={() => setOpen(false)}>
            <img src="/brand/cy-logo-wordmark-on-f7f4ef.jpg" alt="Cy Creations" className="site-logo" />
          </Link>
        </div>
        <nav className="hidden items-center gap-4 text-sm text-ink md:flex lg:gap-6">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="inline-flex min-h-11 items-center hover:text-gold">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-2">
          {donate ? (
            <a
              href={donate}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center border border-ink px-4 text-sm tracking-wide hover:bg-ink hover:text-card"
            >
              Donate
            </a>
          ) : null}
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center border border-line md:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="flex flex-col border-t border-line px-5 py-2 md:hidden">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="min-h-11 border-b border-line/70 py-3 text-sm"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
    </>
  );
}

export function SiteFooter({ studioName }: { studioName: string }) {
  return (
    <footer className="mx-auto flex w-full max-w-6xl flex-col gap-4 bg-paper px-5 py-10 text-sm text-muted sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-end gap-4">
        <img src="/brand/cy-logo-monogram-on-f7f4ef.jpg" alt="" className="h-24 w-auto" />
        <div>
          <p className="font-script text-3xl text-ink">{studioName}</p>
          <p>Art & Design Studio · Caro Gomez</p>
        </div>
      </div>
      <div className="flex flex-col items-start sm:items-end">
        <Link to="/policies" className="inline-flex min-h-11 items-center text-sm underline decoration-line underline-offset-4">
          Policies
        </Link>
        <p>© {new Date().getFullYear()} Cy Creations</p>
      </div>
    </footer>
  );
}
