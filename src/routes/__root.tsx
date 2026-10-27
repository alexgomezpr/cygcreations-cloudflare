import { createRootRoute, HeadContent, Link, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SiteHeader } from "@/components/site-chrome";
import appCss from "../styles.css?url";

import { SHARE_ORIGIN, SITE_ORIGIN } from "@/lib/seo";

const APP_NAME = "Cy Creations";
const DESCRIPTION = "Original artwork, prints, and custom pieces by Caro Gomez. Cy Creations is an art and design studio from San Juan, Puerto Rico.";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "description", content: DESCRIPTION },
      { name: "author", content: "Caro Gomez" },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { name: "theme-color", content: "#f7f4ef" },
      { property: "og:site_name", content: APP_NAME },
      { property: "og:locale", content: "en_US" },
      { property: "og:title", content: `${APP_NAME} | Art & Design Studio` },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: `${SITE_ORIGIN}/` },
      { property: "og:image", content: `${SHARE_ORIGIN}/og.jpg?v=17` },
      { property: "og:image:alt", content: "Cy Creations. Caro Gomez, art and design studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: `${APP_NAME} | Art & Design Studio` },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: `${SHARE_ORIGIN}/x-banner.jpg?v=17` },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&family=Great+Vibes&display=swap",
      },
    ],
  }),
  notFoundComponent: NotFoundPage,
  component: () => (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('js');try{if(parent!==window)document.documentElement.classList.add('is-framed')}catch(e){}",
          }}
        />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});

function NotFoundPage() {
  return (
    <>
      <SiteHeader donateUrl="" />
      <main className="mx-auto max-w-3xl px-5 py-20">
        <p className="text-xs font-medium tracking-[0.22em] text-gold">CY CREATIONS</p>
        <h1 className="mt-3 font-display text-5xl">This page isn't here.</h1>
        <p className="mt-4 text-muted">The link may be old, or the page may have moved.</p>
        <Link to="/" className="mt-6 inline-flex min-h-11 items-center underline">
          Back home
        </Link>
      </main>
    </>
  );
}
