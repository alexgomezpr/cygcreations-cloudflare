import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getStudio, listPublicWorks, sendInquiry, type Work } from "@/lib/studio.functions";
import { money } from "@/lib/money";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { absoluteUrl, seoHead, SHARE_ORIGIN, SITE_ORIGIN } from "@/lib/seo";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [studio, works] = await Promise.all([getStudio(), listPublicWorks()]);
    return { studio, works };
  },
  head: ({ loaderData }) => {
    const studio = loaderData?.studio;
    const works = loaderData?.works ?? [];
    const name = studio?.studioName ?? "Cy Creations";
    const artist = studio?.artistName ?? "Caro Gomez";
    const hero = studio?.hero?.replace(/\s+/g, " ").trim() ?? "";
    const description =
      hero.length > 0 && hero.length <= 158
        ? hero
        : "Original artwork, prints, and custom pieces by Caro Gomez. Cy Creations is an art and design studio from San Juan, Puerto Rico.";
    const instagram = (studio?.instagram ?? "cygcreationss").replace(/^@/, "");
    return seoHead({
      title: `${name} | Art & Design Studio`,
      description,
      path: "/",
      image: `${SHARE_ORIGIN}/og.jpg?v=17`,
      jsonLd: {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": `${SITE_ORIGIN}/#website`,
            url: `${SITE_ORIGIN}/`,
            name,
            description,
            inLanguage: "en",
            publisher: { "@id": `${SITE_ORIGIN}/#studio` },
          },
          {
            "@type": "ArtGallery",
            "@id": `${SITE_ORIGIN}/#studio`,
            name,
            url: `${SITE_ORIGIN}/`,
            image: `${SHARE_ORIGIN}/og.jpg?v=17`,
            description,
            email: studio?.email,
            founder: { "@id": `${SITE_ORIGIN}/#artist` },
            sameAs: [`https://www.instagram.com/${instagram}/`],
          },
          {
            "@type": "Person",
            "@id": `${SITE_ORIGIN}/#artist`,
            name: artist,
            jobTitle: "Artist",
            url: `${SITE_ORIGIN}/`,
            image: `${SHARE_ORIGIN}/og.jpg?v=17`,
            homeLocation: { "@type": "Place", name: "San Juan, Puerto Rico" },
            sameAs: [`https://www.instagram.com/${instagram}/`],
          },
          {
            "@type": "ItemList",
            name: "Artwork by Caro Gomez",
            itemListOrder: "https://schema.org/ItemListOrderAscending",
            numberOfItems: works.length,
            itemListElement: works.map((work, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: `${SITE_ORIGIN}/work/${work.id}`,
              name: work.title,
              image: absoluteUrl(work.imageSrc),
            })),
          },
        ],
      },
    });
  },
  component: Home,
});

function Home() {
  const { studio, works } = Route.useLoaderData();
  const paragraphs = studio.about.split(/\n\n+/).filter(Boolean);
  const categories = ["All", ...new Set(works.map((work) => work.category))];
  const [filter, setFilter] = useState("All");
  const visible = filter === "All" ? works : works.filter((work) => work.category === filter);
  const chosen = works.filter((work) => work.showInHero).slice(0, 6);
  const heroWorks = chosen.length > 0 ? chosen : works.slice(0, 3);

  return (
    <>
      <SiteHeader donateUrl={studio.donateUrl} />
      <main>
        <section className="overflow-x-clip bg-[#e7dccb]">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:py-10">
            <div className="min-w-0">
              <p className="reveal text-xs font-medium tracking-[0.22em] text-gold">ORIGINAL ART · DESIGN · CREATIVE WORK</p>
              <h1
                className="reveal mt-3 font-display leading-[0.92] text-ink"
                style={{ fontSize: "clamp(56px, 8vw, 104px)" }}
              >
                Where imagination becomes <Accent italic>art.</Accent>
              </h1>
              <p className="reveal mt-5 max-w-[60ch] text-base text-muted">{studio.hero}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#shop" className="inline-flex min-h-11 items-center bg-ink px-5 text-sm text-card">
                  Explore the collection
                </a>
                <a href="#about" className="inline-flex min-h-11 items-center border border-ink px-5 text-sm">
                  Meet the creator
                </a>
              </div>
              <Collage works={heroWorks} className="mt-6 lg:hidden" />
            </div>
            <div className="relative hidden h-[28rem] lg:block" data-parallax>
              <Collage works={heroWorks} />
            </div>
          </div>
        </section>

        <section className="bg-cream px-5 py-16 text-center">
          <p className="reveal text-xs font-medium tracking-[0.22em] text-gold">A CREATIVE SPACE</p>
          <h2 className="reveal mt-3 font-display text-5xl leading-none sm:text-6xl">
            Made from ideas, <Accent>stories & imagination.</Accent>
          </h2>
          <p className="reveal mx-auto mt-5 max-w-xl text-muted">
            Each piece is an opportunity to experiment, express, and share a different point of view.
          </p>
        </section>

        <section id="shop" className="mx-auto max-w-6xl px-5 py-16">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="reveal text-xs font-medium tracking-[0.22em] text-gold">SHOP</p>
              <h2 className="reveal font-display text-5xl">Available creations</h2>
            </div>
            <p className="max-w-xs text-base text-muted">{studio.negotiateNote}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setFilter(category)}
                className={`min-h-11 border px-4 text-sm ${filter === category ? "border-ink bg-ink text-card" : "border-line"}`}
              >
                {category}
              </button>
            ))}
          </div>
          {visible.length === 0 ? (
            <p className="mt-8 border border-dashed border-line px-6 py-16 text-center text-muted">
              New creations will appear here soon.
            </p>
          ) : (
            <div className="shop-grid mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {visible.map((piece, index) => (
                <WorkCard key={piece.id} piece={piece} index={index} />
              ))}
            </div>
          )}
          <p className="mt-6 text-base text-muted">{studio.shippingNote}</p>
        </section>

        <section id="about" className="overflow-x-clip bg-cream">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:gap-16">
            <div className="relative md:mx-auto md:max-w-[380px] lg:mx-0 lg:max-w-none">
              <span
                aria-hidden
                className="pointer-events-none absolute top-[14px] left-[14px] h-full w-full rounded-t-[999px] border border-hibiscus"
              />
              <img
                src={studio.hasAboutPhoto ? `/api/about-photo?w=720&v=${studio.aboutPhotoVersion}` : "/brand/caro-about-cream-v2.jpg"}
                srcSet={
                  studio.hasAboutPhoto
                    ? `/api/about-photo?w=720&v=${studio.aboutPhotoVersion} 720w, /api/about-photo?w=1400&v=${studio.aboutPhotoVersion} 1400w`
                    : "/brand/caro-about-cream-v2.jpg 574w"
                }
                sizes="(min-width: 1024px) 460px, (min-width: 768px) 380px, 92vw"
                width={574}
                height={630}
                alt="Caro Gomez, creator of Cy Creations"
                className="relative aspect-[4/5] w-full max-w-[460px] rounded-t-[999px] bg-[#faf6ed] object-cover object-[50%_0] md:max-w-[380px] lg:w-[460px] lg:max-w-[460px]"
              />
            </div>
            <div className="max-w-[62ch]">
              <p className="reveal text-xs font-medium tracking-[0.22em] text-gold">THE CREATOR · CARO GOMEZ</p>
              <h2 className="reveal mt-2 font-display text-5xl">
                Hello, I'm <Accent>Caro.</Accent>
              </h2>
              <div className="mt-5 space-y-4 text-base leading-[1.7] text-muted">
                {paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)} className="reveal">
                    {paragraph}
                  </p>
                ))}
              </div>
              <p className="reveal mt-8 font-script text-6xl text-ink md:text-7xl">Caro</p>
            </div>
          </div>
        </section>

        <section id="gallery" className="mx-auto max-w-6xl px-5 py-16">
          <p className="reveal text-xs font-medium tracking-[0.22em] text-gold">PORTFOLIO</p>
          <h2 className="reveal font-display text-5xl">Gallery</h2>
          <Gallery works={works} />
        </section>

        <section id="custom" className="bg-card">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2">
            <div>
              <p className="reveal text-xs font-medium tracking-[0.22em] text-gold">CUSTOM CREATIONS</p>
              <h2 className="reveal font-display text-5xl leading-none">
                Have an idea <Accent>of your own?</Accent>
              </h2>
              <p className="reveal mt-5 text-muted">
                Tell Caro what you're imagining. A clear concept or just the beginning of one is enough.
              </p>
            </div>
            <InquiryForm />
          </div>
        </section>

        <section id="contact" className="bg-ink text-card">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <p className="reveal text-xs font-medium tracking-[0.22em] text-gold-light">CONTACT</p>
            <h2 className="reveal font-display text-5xl leading-none">
              Let's create <Accent>something special.</Accent>
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <a href={`mailto:${studio.email}`} className="min-h-20 border border-white/15 px-5 py-6">
                <span className="block text-xs tracking-[0.18em] text-gold-light">EMAIL</span>
                <span className="mt-1 block">{studio.email}</span>
              </a>
              <a
                href={`https://www.instagram.com/${studio.instagram.replace(/^@/, "")}/`}
                target="_blank"
                rel="noreferrer"
                className="min-h-20 border border-white/15 px-5 py-6"
              >
                <span className="block text-xs tracking-[0.18em] text-gold-light">INSTAGRAM</span>
                <span className="mt-1 block">@{studio.instagram.replace(/^@/, "")}</span>
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter studioName={studio.studioName} />
    </>
  );
}

function WorkCard({ piece, index }: { piece: Work; index: number }) {
  return (
    <article className="reveal-card flex min-w-0 flex-col border border-line bg-card" style={{ ["--i" as string]: index }}>
      <Link to="/work/$id" params={{ id: String(piece.id) }} className="relative overflow-hidden bg-cream">
        <img
          src={piece.imageSrc}
          alt={`${piece.title} by Caro Gomez`}
          width={800}
          height={1000}
          loading="lazy"
          decoding="async"
          className="reveal-img aspect-[4/5] w-full object-cover"
        />
        {piece.status === "sold" ? (
          <span className="absolute top-3 left-3 bg-sold px-2 py-1 text-xs tracking-widest text-card">SOLD</span>
        ) : null}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col p-5">
        <p className="text-xs tracking-[0.18em] break-words text-gold">{piece.category.toUpperCase()}</p>
        <h3 className="font-display text-3xl break-words">{piece.title}</h3>
        <p className="text-sm text-muted">{piece.medium}</p>
        <p className="mt-3 font-medium tabular-nums">{money(piece.priceCents)}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/work/$id" params={{ id: String(piece.id) }} className="min-h-11 py-2 text-sm underline underline-offset-4">
            View piece
          </Link>
          {piece.status === "available" && piece.stripeUrl ? (
            <a href={piece.stripeUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center bg-ink px-4 text-sm text-card">
              Buy
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function InquiryForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="grid gap-3"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        const form = event.currentTarget;
        const data = new FormData(form);
        const name = String(data.get("name") ?? "").trim();
        const email = String(data.get("email") ?? "").trim();
        const message = String(data.get("message") ?? "").trim();
        if (!name || !email || !message) {
          setError("Name, email, and a note are required.");
          return;
        }
        if (!EMAIL.test(email)) {
          setError("Enter a real email address.");
          return;
        }
        setPending(true);
        setError("");
        void sendInquiry({ data: { name, email, message } })
          .then(() => setSent(true))
          .catch((reason: unknown) => {
            const messageText = reason instanceof Error ? reason.message : "";
            setError(
              !messageText || /failed to fetch|network|load failed/i.test(messageText)
                ? "That didn't send. Check your connection and try again."
                : messageText,
            );
          })
          .finally(() => setPending(false));
      }}
    >
      <label className="grid gap-1 text-sm">
        Name
        <input name="name" required className="min-h-11 border border-line bg-paper px-3" />
      </label>
      <label className="grid gap-1 text-sm">
        Email
        <input name="email" type="email" required className="min-h-11 border border-line bg-paper px-3" />
      </label>
      <label className="grid gap-1 text-sm">
        What are you imagining?
        <textarea name="message" required rows={5} className="border border-line bg-paper px-3 py-2" />
      </label>
      {error ? <p className="text-sm text-sold">{error}</p> : null}
      {sent ? <p className="text-sm">Sent. Caro will see this in Studio.</p> : null}
      <button type="submit" disabled={pending} className="min-h-11 bg-ink px-5 text-sm text-card disabled:opacity-60">
        {pending ? "Sending…" : "Start a conversation"}
      </button>
    </form>
  );
}

const heroSlots = [
  { rotate: "-rotate-3", place: "left-0 top-4 w-[48%]" },
  { rotate: "rotate-2", place: "right-0 top-16 w-[50%]" },
  { rotate: "-rotate-1", place: "left-[18%] bottom-0 w-[46%]" },
] as const;

function PrintImage({ piece, priority }: { piece: Work; priority?: boolean }) {
  return (
    <img
      src={piece.imageSrc}
      alt={piece.title}
      width={720}
      height={900}
      loading="eager"
      decoding={priority ? "auto" : "async"}
      fetchPriority={priority ? "high" : "auto"}
      className="aspect-[4/5] h-full w-full object-cover"
    />
  );
}

function Collage({ works, className = "" }: { works: Work[]; className?: string }) {
  if (works.length === 0) return null;
  const strip = className.includes("lg:hidden");
  if (strip) {
    return (
      <div className={`hero-strip flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 ${className}`}>
        {works.map((piece, index) => (
          <figure
            key={piece.id}
            className={`w-[72%] shrink-0 snap-center bg-[#fffefa] p-2.5 shadow-[0_16px_36px_rgba(38,38,36,0.14)] ${heroSlots[index % heroSlots.length]?.rotate ?? ""}`}
          >
            <PrintImage piece={piece} priority={index === 0} />
          </figure>
        ))}
      </div>
    );
  }
  if (works.length > 3) {
    return (
      <div className={`flex h-full snap-x snap-mandatory items-center gap-4 overflow-x-auto pb-2 ${className}`}>
        {works.map((piece, index) => (
          <figure
            key={piece.id}
            className={`w-[46%] shrink-0 snap-center bg-[#fffefa] p-2.5 shadow-[0_18px_40px_rgba(38,38,36,0.16)] ${heroSlots[index % heroSlots.length]?.rotate ?? ""}`}
          >
            <PrintImage piece={piece} priority={index === 0} />
          </figure>
        ))}
      </div>
    );
  }
  return (
    <div className={className}>
      {works.map((piece, index) => (
        <figure
          key={piece.id}
          className={`absolute bg-[#fffefa] p-2.5 shadow-[0_18px_40px_rgba(38,38,36,0.16)] ${heroSlots[index]?.rotate ?? ""} ${heroSlots[index]?.place ?? ""}`}
        >
          <PrintImage piece={piece} priority={index === 0} />
        </figure>
      ))}
    </div>
  );
}

function Accent({ children, italic = false }: { children: string; italic?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const path = host.querySelector<SVGPathElement>("svg.brush path");
    const brush = host.querySelector<HTMLElement>(".paint-brush");
    if (!path || !brush) return;
    let cancel = () => {};
    let playing = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          if (playing) return;
          cancel();
          playing = true;
          path.style.transition = "none";
          path.style.strokeDasharray = "1";
          path.style.strokeDashoffset = "1";
          host.classList.add("is-in");
          const stop = paintAccent(host, path, brush);
          cancel = () => {
            stop();
            playing = false;
          };
          return;
        }
        if (!entry.isIntersecting) {
          cancel();
          path.style.transition = "none";
          path.style.strokeDashoffset = "1";
          brush.style.transition = "none";
          brush.style.opacity = "0";
          brush.style.visibility = "hidden";
        }
      },
      { threshold: [0, 0.6] },
    );
    observer.observe(host);
    return () => {
      observer.disconnect();
      cancel();
    };
  }, []);
  return (
    <span ref={ref} className={italic ? "script-accent italic" : "script-accent font-script"}>
      {children}
      <svg className="brush" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
        <path pathLength={1} d="M1 5 C 16 2.1, 27 6.7, 44 3.5 C 60 1.2, 69 6.8, 83 3.7 C 91 2, 96 5.4, 99 4.1" />
      </svg>
      <span className="paint-brush" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 40" className="block h-full w-full">
          <defs>
            <linearGradient id="cyb-h" x1="0" x2="1">
              <stop offset="0" stopColor="#050505" />
              <stop offset=".35" stopColor="#4a4744" />
              <stop offset=".55" stopColor="#1c1b1a" />
              <stop offset="1" stopColor="#050505" />
            </linearGradient>
            <linearGradient id="cyb-f" x1="0" x2="1">
              <stop offset="0" stopColor="#6e5223" />
              <stop offset=".4" stopColor="#f1dca6" />
              <stop offset=".65" stopColor="#b08d57" />
              <stop offset="1" stopColor="#5e461d" />
            </linearGradient>
            <linearGradient id="cyb-b" x1="0" x2="1">
              <stop offset="0" stopColor="#7a5532" />
              <stop offset=".45" stopColor="#d9b88a" />
              <stop offset="1" stopColor="#6b4728" />
            </linearGradient>
            <linearGradient id="cyb-r" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#b8333a" stopOpacity="0" />
              <stop offset=".45" stopColor="#b8333a" stopOpacity=".9" />
              <stop offset="1" stopColor="#8f1f27" />
            </linearGradient>
          </defs>
          <path fill="url(#cyb-h)" d="M8.6 1.6C8.6.9 9.2.5 10 .5s1.4.4 1.4 1.1l.7 12.6c.1 2.2-.1 4.5-.3 6.8H8.2c-.2-2.3-.4-4.6-.3-6.8Z" />
          <rect x="8.1" y="15.3" width="3.8" height=".7" fill="#b08d57" />
          <path fill="url(#cyb-f)" d="M7.8 20.6h4.4l.2 6.4H7.6Z" />
          <path fill="#5e461d" opacity=".6" d="M7.7 22.1h4.6v.5H7.7Zm0 1.2h4.6v.4H7.7Z" />
          <path fill="url(#cyb-b)" d="M7.6 26.8C6.3 28 5.9 30.2 6.3 32.4c.5 2.9 2.2 5.2 3.7 7.6 1.5-2.4 3.2-4.7 3.7-7.6.4-2.2 0-4.4-1.3-5.6Z" />
          <path fill="url(#cyb-r)" d="M6.2 31.6c0 .3.1.5.1.8.5 2.9 2.2 5.2 3.7 7.6 1.5-2.4 3.2-4.7 3.7-7.6l.1-.8c-2.5 1-5.1 1-7.6 0Z" />
          <path fill="none" stroke="#4a2f1a" strokeWidth=".25" strokeLinecap="round" opacity=".7" d="M8.5 27.3c-.9 3.2-.4 7 1.1 11.4M10 27.2v11.6M11.5 27.3c.9 3.2.4 7-1.1 11.4M9.5 39.1l-.5.6M10.5 39.1l.4.5" />
          <path fill="#fff" opacity=".35" d="M8.9 1.4c.3-.4.8-.5 1-.5-.3.5-.4 4-.3 13.5h-.6Z" />
        </svg>
      </span>
    </span>
  );
}

function paintAccent(host: HTMLElement, path: SVGPathElement, brush: HTMLElement) {
  const svg = path.ownerSVGElement;
  if (!svg) return () => {};
  const total = path.getTotalLength();
  const start = performance.now();
  let frame = 0;
  let hold = 0;
  let stopped = false;
  path.style.transition = "none";
  path.style.strokeDasharray = "1";

  const place = (elapsed: number) => {
    const t = Math.min(1, elapsed / 2000);
    const ease = -(Math.cos(Math.PI * t) - 1) / 2;
    const point = path.getPointAtLength(total * ease);
    const svgBox = svg.getBoundingClientRect();
    const hostBox = host.getBoundingClientRect();
    const box = svg.viewBox.baseVal;
    let x = svgBox.left - hostBox.left + (point.x / box.width) * svgBox.width;
    const y = svgBox.top - hostBox.top + (point.y / box.height) * svgBox.height;
    const heading = host.closest("h1, h2, h3") ?? host;
    const head = heading.getBoundingClientRect();
    const width = brush.offsetWidth;
    const height = brush.offsetHeight;
    const tilt = (35 * Math.PI) / 180;
    const leftReach = (width / 2) * Math.cos(tilt) + height * Math.sin(tilt);
    const rightReach = (width / 2) * Math.cos(tilt);
    const minX = head.left - hostBox.left + leftReach;
    const maxX = head.right - hostBox.left - rightReach;
    if (minX < maxX) x = Math.min(Math.max(x, minX), maxX);
    path.style.strokeDashoffset = String(1 - ease);
    brush.style.visibility = "visible";
    brush.style.opacity = "1";
    brush.style.transform = `translate3d(${x - width / 2}px, ${y - height}px, 0) rotate(-35deg)`;
    return { t, x, y, width, height };
  };

  const step = (now: number) => {
    if (stopped) return;
    const spot = place(now - start);
    if (spot.t < 1) {
      frame = requestAnimationFrame(step);
      return;
    }
    hold = window.setTimeout(() => {
      if (stopped) return;
      brush.style.transition = "none";
      brush.getBoundingClientRect();
      brush.style.transition = "transform 500ms ease-out, opacity 500ms ease-out";
      brush.style.opacity = "0";
      brush.style.transform = `translate3d(${spot.x - spot.width / 2}px, ${spot.y - spot.height - 8}px, 0) rotate(-35deg)`;
    }, 150);
  };
  frame = requestAnimationFrame(step);
  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
    window.clearTimeout(hold);
  };
}

function Gallery({ works }: { works: Work[] }) {
  const [open, setOpen] = useState<Work | null>(null);
  return (
    <>
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {works.map((piece, index) => (
          <button
            key={piece.id}
            type="button"
            className="gallery-tile reveal-card overflow-hidden bg-cream text-left"
            style={{ ["--i" as string]: index }}
            onClick={() => setOpen(piece)}
          >
            <img
              src={piece.imageSrc}
              alt={`${piece.title} by Caro Gomez`}
              width={800}
              height={800}
              loading="lazy"
              decoding="async"
              className="reveal-img aspect-square w-full object-cover"
            />
          </button>
        ))}
      </div>
      {open ? <Lightbox piece={open} onClose={() => setOpen(null)} /> : null}
    </>
  );
}

function Lightbox({ piece, onClose }: { piece: Work; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    const items = () => [...dialog.querySelectorAll<HTMLElement>("button, a[href]")];
    items()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const list = items();
      const first = list[0];
      const last = list[list.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={piece.title}
        className="max-h-[90vh] w-full max-w-3xl overflow-auto bg-card p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          src={piece.imageSrc}
          alt={`${piece.title} by Caro Gomez`}
          loading="lazy"
          decoding="async"
          className="max-h-[70vh] w-full object-contain"
        />
        <div className="mt-4 flex items-center justify-between gap-3">
          <Link to="/work/$id" params={{ id: String(piece.id) }} className="min-h-11 py-2 text-sm underline">
            View piece
          </Link>
          <button type="button" className="inline-flex min-h-11 items-center border border-ink px-4 text-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

