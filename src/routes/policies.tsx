import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { seoHead } from "@/lib/seo";
import { getStudio } from "@/lib/studio.functions";

export const Route = createFileRoute("/policies")({
  loader: () => getStudio(),
  head: () =>
    seoHead({
      title: "Policies | Cy Creations",
      description: "Privacy, shipping, returns and artwork rights for Cy Creations.",
      path: "/policies",
    }),
  component: PoliciesPage,
});

function PoliciesPage() {
  const studio = Route.useLoaderData();
  const email = studio.email.trim();
  const instagram = studio.instagram.replace(/^@/, "").trim();

  return (
    <>
      <SiteHeader donateUrl={studio.donateUrl} />
      <main className="mx-auto max-w-[680px] px-5 py-16">
        <h1 className="reveal font-display text-5xl">Policies</h1>
        <p className="reveal mt-3 text-sm text-muted">Last updated: October 20, 2026</p>

        <section className="mt-12">
          <h2 className="reveal font-display text-4xl">Privacy</h2>
          <div className="mt-4 space-y-4 text-base leading-[1.7] text-muted">
            <p className="reveal">
              Cy Creations (operated by Caro Gomez, San Juan, Puerto Rico) collects only what's needed to answer
              messages and fill orders: your name, email, and anything you choose to send me, plus order and shipping
              details when you buy.
            </p>
            <p className="reveal">
              Payments are processed securely by Stripe. I never see or store your full card number, and Stripe's own
              privacy policy covers payment data.
            </p>
            <p className="reveal">
              I don't sell or rent your information, and I only use it to communicate with you about your inquiry or
              order. This site doesn't use analytics or advertising trackers. The only cookie is a security cookie set
              by the hosting provider to protect the site from bots.
            </p>
            <p className="reveal">
              To ask what I have on file or to have it deleted, email <Mail email={email} />.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="reveal font-display text-4xl">Sales & shipping</h2>
          <div className="mt-4 space-y-4 text-base leading-[1.7] text-muted">
            <p className="reveal">
              Prices are listed in US dollars. Each original is one of a kind and is sold once payment is complete.
            </p>
            <p className="reveal">
              Shipping is free within Puerto Rico and the United States. Orders ship within 1–2 weeks, and you'll get
              tracking by email when your piece is on its way.
            </p>
            <p className="reveal">
              Pieces are packed with care. If yours arrives damaged, email photos of the piece and packaging to{" "}
              <Mail email={email} /> within 3 days of delivery and I'll make it right.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="reveal font-display text-4xl">Returns & custom work</h2>
          <div className="mt-4 space-y-4 text-base leading-[1.7] text-muted">
            <p className="reveal">
              All sales are final. Because each original is one of a kind, I don't accept returns or exchanges, except
              for pieces that arrive damaged (see above).
            </p>
            <p className="reveal">
              Custom and commissioned pieces require a 50% deposit to reserve your spot. The deposit is fully
              refundable until work begins. Once I start your piece, the deposit is non-refundable, and the balance is
              due before it ships.
            </p>
            <p className="reveal">
              Approved refunds are sent to the original payment method within 7 business days.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="reveal font-display text-4xl">Artwork rights</h2>
          <div className="mt-4 space-y-4 text-base leading-[1.7] text-muted">
            <p className="reveal">
              All artwork, photos and designs on this site are © Cy Creations / Caro Gomez. Buying a piece gives you
              the physical artwork, not the copyright. Please don't reproduce, print, or use the images commercially
              without written permission.
              {instagram ? (
                <>
                  {" "}
                  Sharing photos of your piece with credit to <Instagram handle={instagram} /> is always welcome.
                </>
              ) : null}
            </p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="reveal font-display text-4xl">Contact</h2>
          <p className="reveal mt-4 text-base leading-[1.7] text-muted">
            Questions? Email <Mail email={email} />.
          </p>
        </section>
      </main>
      <SiteFooter studioName={studio.studioName} />
    </>
  );
}

function Mail({ email }: { email: string }) {
  if (!email) return null;
  return (
    <a href={`mailto:${email}`} className="text-ink underline decoration-line underline-offset-4">
      {email}
    </a>
  );
}

function Instagram({ handle }: { handle: string }) {
  return (
    <a
      href={`https://www.instagram.com/${handle}/`}
      target="_blank"
      rel="noreferrer"
      className="text-ink underline decoration-line underline-offset-4"
    >
      @{handle}
    </a>
  );
}
