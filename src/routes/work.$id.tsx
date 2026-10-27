import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getPublicWork, getStudio } from "@/lib/studio.functions";
import { money } from "@/lib/money";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { absoluteUrl, clip, seoHead, SITE_ORIGIN } from "@/lib/seo";

export const Route = createFileRoute("/work/$id")({
  beforeLoad: async () => {
    const studio = await getStudio();
    return { studio };
  },
  loader: async ({ params, context }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id < 1) throw notFound();
    const piece = await getPublicWork({ data: id });
    if (!piece) throw notFound();
    return { studio: context.studio, piece };
  },
  head: ({ loaderData, params }) => {
    const piece = loaderData?.piece;
    const artist = loaderData?.studio.artistName ?? "Caro Gomez";
    if (!piece) {
      return seoHead({
        title: "Piece not found · Cy Creations",
        description: "This artwork is not on view at Cy Creations.",
        path: `/work/${params.id}`,
        noindex: true,
      });
    }
    const description = clip(
      `${piece.title} by ${artist}. ${[piece.medium, piece.story].filter(Boolean).join(". ")} Original artwork from Cy Creations.`,
    );
    const page = `${SITE_ORIGIN}/work/${piece.id}`;
    return seoHead({
      title: `${piece.title} · Cy Creations`,
      description,
      path: `/work/${piece.id}`,
      image: piece.imageSrc,
      type: "article",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "VisualArtwork",
          name: piece.title,
          url: page,
          image: absoluteUrl(piece.imageSrc),
          description,
          artMedium: piece.medium || undefined,
          artform: piece.category,
          creator: { "@type": "Person", name: artist, url: `${SITE_ORIGIN}/` },
          ...(piece.priceCents == null
            ? {}
            : {
                offers: {
                  "@type": "Offer",
                  priceCurrency: "USD",
                  price: (piece.priceCents / 100).toFixed(2),
                  availability:
                    piece.status === "sold" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
                  url: page,
                },
              }),
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Cy Creations", item: `${SITE_ORIGIN}/` },
            { "@type": "ListItem", position: 2, name: piece.title, item: page },
          ],
        },
      ],
    });
  },
  component: PiecePage,
  notFoundComponent: MissingPiece,
});

const ART_PIXELS: Record<string, { width: number; height: number }> = {
  "/art/floral.jpg": { width: 825, height: 613 },
  "/art/tote.jpg": { width: 1080, height: 1010 },
  "/art/street.jpg": { width: 1064, height: 1106 },
  "/art/sanse.jpg": { width: 1076, height: 1076 },
};

function MissingPiece() {
  const { studio } = Route.useRouteContext();
  return (
    <>
      <SiteHeader donateUrl={studio.donateUrl} />
      <main className="mx-auto max-w-3xl px-5 py-20">
        <h1 className="font-display text-5xl">This piece isn't on the wall.</h1>
        <Link to="/" hash="shop" className="mt-6 inline-flex min-h-11 items-center underline">
          Back to the shop
        </Link>
      </main>
      <SiteFooter studioName={studio.studioName} />
    </>
  );
}
function PiecePage() {
  const { studio, piece } = Route.useLoaderData();
  const ask = `mailto:${studio.email}?subject=${encodeURIComponent(piece.title)}`;
  const pixels = ART_PIXELS[piece.imageSrc];
  return (
    <>
      <SiteHeader donateUrl={studio.donateUrl} />
      <main>
        <article className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-2">
        <div className="relative bg-cream">
          <img
            src={piece.imageSrc}
            alt={`${piece.title} by ${studio.artistName}`}
            width={pixels?.width}
            height={pixels?.height}
            loading="eager"
            fetchPriority="high"
            decoding="auto"
            className="h-auto w-full object-contain"
            style={pixels ? { aspectRatio: `${pixels.width} / ${pixels.height}` } : undefined}
          />
          {piece.status === "sold" ? (
            <span className="absolute top-4 left-4 bg-sold px-2 py-1 text-xs tracking-widest text-card">SOLD</span>
          ) : null}
        </div>
        <div>
          <p className="text-xs tracking-[0.18em] text-gold">{piece.category.toUpperCase()}</p>
          <h1 className="font-display text-6xl leading-none">{piece.title}</h1>
          <p className="mt-4 text-2xl tabular-nums">{money(piece.priceCents)}</p>
          <dl className="mt-6 grid gap-2 text-sm text-muted">
            {piece.medium ? (
              <div>
                <dt className="text-ink">Medium</dt>
                <dd>{piece.medium}</dd>
              </div>
            ) : null}
            {piece.sizeLabel ? (
              <div>
                <dt className="text-ink">Size</dt>
                <dd>{piece.sizeLabel}</dd>
              </div>
            ) : null}
          </dl>
          {piece.story ? <p className="mt-6 text-muted">{piece.story}</p> : null}
          <p className="mt-4 text-sm text-muted">{studio.negotiateNote}</p>
          <p className="text-sm text-muted">{studio.shippingNote}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {piece.status === "available" && piece.stripeUrl ? (
              <a href={piece.stripeUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center bg-ink px-5 text-sm text-card">
                Buy
              </a>
            ) : null}
            {piece.status !== "sold" ? (
              <a href={ask} className="inline-flex min-h-11 items-center border border-ink px-5 text-sm">
                Ask about this piece
              </a>
            ) : null}
            <a href="/#shop" className="inline-flex min-h-11 items-center px-2 text-sm underline">
              All work
            </a>
          </div>
        </div>
        </article>
      </main>
      <SiteFooter studioName={studio.studioName} />
    </>
  );
}
