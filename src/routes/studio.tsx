import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { UserButton } from "@/lib/auth/gates";
import { signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { ChoosePassword, OwnerPortal, portalSearch } from "@/components/owner-portal";
import { portalAccess } from "@/lib/auth/portal.functions";
import {
  createWork,
  deleteWork,
  exportSiteData,
  getStudioAdmin,
  importSiteData,
  siteNeedsImport,
  saveStudio,
  updateWork,
  type Inquiry,
  type StudioProfile,
  type Work,
} from "@/lib/studio.functions";
import { money } from "@/lib/money";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/studio")({
  validateSearch: portalSearch,
  component: StudioPage,
  head: () =>
    seoHead({
      title: "Studio · Cy Creations",
      description: "Sign in to manage your site.",
      path: "/studio",
      noindex: true,
    }),
});

type Admin = Awaited<ReturnType<typeof getStudioAdmin>>;
type Gate = "check" | "password" | "denied" | "ready";

function StudioPage() {
  const search = Route.useSearch();
  const { user, isPending } = useCurrentUserState();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [error, setError] = useState("");
  const [gate, setGate] = useState<Gate>("check");
  const [needsImport, setNeedsImport] = useState(false);

  useEffect(() => {
    let alive = true;
    void siteNeedsImport()
      .then((result) => {
        if (alive) setNeedsImport(result.needsImport);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    void portalAccess()
      .then((access) => {
        if (!alive) return;
        if (!access.owner) setGate("denied");
        else if (access.needsPassword) setGate("password");
        else setGate("ready");
      })
      .catch((reason: unknown) => {
        if (!alive) return;
        setError(reason instanceof Error ? reason.message : "Could not open Studio.");
        setGate("ready");
      });
    return () => {
      alive = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user || gate !== "ready") return;
    let alive = true;
    void getStudioAdmin()
      .then((data) => {
        if (alive) setAdmin(data);
      })
      .catch((reason: unknown) => {
        if (alive) setError(reason instanceof Error ? reason.message : "Could not open Studio.");
      });
    return () => {
      alive = false;
    };
  }, [user?.id, gate]);

  if (search.token) return <OwnerPortal search={search} />;
  if (needsImport) return <ImportCopy onDone={() => setNeedsImport(false)} />;
  if (isPending || (user && gate === "check" && !error)) {
    return <main className="grid min-h-screen place-items-center text-muted">Opening Studio…</main>;
  }
  if (!user) return <OwnerPortal search={search} />;
  if (gate === "password") return <ChoosePassword onSaved={() => setGate("ready")} />;
  if (gate === "denied") {
    return (
      <main className="grid min-h-screen place-items-center bg-paper px-5">
        <div className="w-full max-w-md text-center">
          <h1 className="font-display text-4xl">Owner portal</h1>
          <p className="mt-3 text-sm text-muted">That sign-in didn't open the studio.</p>
          <button type="button" className="mt-6 min-h-11 underline" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.18em] text-gold">STUDIO</p>
          <h1 className="font-display text-5xl">Cy Creations</h1>
        </div>
        <UserButton />
      </div>
      <p className="mt-2 text-sm text-muted">
        Signed in as {user.primaryEmail ?? "this account"}. Changes show on the public site right away.
      </p>
      <Link to="/" className="mt-3 inline-flex min-h-11 items-center text-sm underline">
        View the public site
      </Link>
      <ExportCopy />
      {error ? <p className="mt-6 text-sm text-sold">{error}</p> : null}
      {!admin && !error ? <p className="mt-8 text-muted">Loading your pieces…</p> : null}
      {admin ? <StudioEditor admin={admin} onChange={setAdmin} /> : null}
    </main>
  );
}

function ImportCopy({ onDone }: { onDone: () => void }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-5">
      <form
        className="grid w-full max-w-md gap-4 bg-card p-6"
        onSubmit={(event) => {
          event.preventDefault();
          const input = event.currentTarget.elements.namedItem("copy");
          const file = input instanceof HTMLInputElement ? input.files?.[0] : undefined;
          if (!file) return;
          setPending(true);
          setMessage("");
          void file
            .text()
            .then((raw) => importSiteData({ data: JSON.parse(raw) }))
            .then(() => onDone())
            .catch((reason: unknown) => setMessage(reason instanceof Error ? reason.message : "Could not load that file."))
            .finally(() => setPending(false));
        }}
      >
        <h1 className="font-display text-4xl">Load your site</h1>
        <p className="text-sm text-muted">
          Choose the file you downloaded from Studio on the current site. This fills the empty Cloudflare database.
        </p>
        <input name="copy" type="file" accept="application/json,.json" required className="min-h-11 text-sm" />
        {message ? <p className="text-sm text-sold">{message}</p> : null}
        <button type="submit" disabled={pending} className="min-h-11 bg-ink text-sm text-card disabled:opacity-60">
          {pending ? "Loading…" : "Load site copy"}
        </button>
      </form>
    </main>
  );
}

function ExportCopy() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <div className="mt-4">
      <button
        type="button"
        disabled={pending}
        className="min-h-11 border border-line px-4 text-sm disabled:opacity-60"
        onClick={() => {
          setPending(true);
          setMessage("");
          void exportSiteData()
            .then((data) => {
              const file = new Blob([JSON.stringify(data)], { type: "application/json" });
              const url = URL.createObjectURL(file);
              const link = document.createElement("a");
              link.href = url;
              link.download = "cygcreations-export.json";
              link.click();
              URL.revokeObjectURL(url);
              setMessage("Download started. Keep that file private. It contains the studio login.");
            })
            .catch((reason: unknown) => setMessage(reason instanceof Error ? reason.message : "Could not export."))
            .finally(() => setPending(false));
        }}
      >
        {pending ? "Preparing copy…" : "Download site copy"}
      </button>
      {message ? <p className="mt-2 text-sm text-muted">{message}</p> : null}
    </div>
  );
}

function StudioEditor({ admin, onChange }: { admin: Admin; onChange: (next: Admin) => void }) {
  return (
    <div className="mt-8 grid gap-10">
      <ProfileForm
        studio={admin.studio}
        onSaved={(studio) => onChange({ ...admin, studio })}
      />
      <WorkForm
        onCreated={async () => onChange(await getStudioAdmin())}
      />
      <section className="grid gap-4">
        <h2 className="font-display text-4xl">Pieces</h2>
        {admin.works.length === 0 ? <p className="text-muted">Nothing here yet.</p> : null}
        {admin.works.map((piece) => (
          <PieceEditor
            key={piece.id}
            piece={piece}
            onChanged={async () => onChange(await getStudioAdmin())}
          />
        ))}
      </section>
      <Inquiries items={admin.inquiries} />
    </div>
  );
}

function ProfileForm({ studio, onSaved }: { studio: StudioProfile; onSaved: (studio: StudioProfile) => void }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <form
      className="grid gap-3 border border-line bg-card p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const file = data.get("aboutPhoto");
        setPending(true);
        setMessage("");
        void (async () => {
          const aboutImage = file instanceof File && file.size > 0 ? await compressImage(file) : "";
          const next: StudioProfile = {
            studioName: String(data.get("studioName") ?? ""),
            artistName: String(data.get("artistName") ?? ""),
            hero: String(data.get("hero") ?? ""),
            about: String(data.get("about") ?? ""),
            email: String(data.get("email") ?? ""),
            instagram: String(data.get("instagram") ?? ""),
            donateUrl: String(data.get("donateUrl") ?? ""),
            shippingNote: String(data.get("shippingNote") ?? ""),
            negotiateNote: String(data.get("negotiateNote") ?? ""),
            plannedDomain: String(data.get("plannedDomain") ?? ""),
            hasAboutPhoto: aboutImage.length > 0 || studio.hasAboutPhoto,
            aboutPhotoVersion: aboutImage.length > 0 ? aboutImage.length : studio.aboutPhotoVersion,
          };
          await saveStudio({ data: { ...next, aboutImage } });
          onSaved(next);
          setMessage("Saved.");
        })()
          .catch((reason: unknown) => setMessage(reason instanceof Error ? reason.message : "Could not save."))
          .finally(() => setPending(false));
      }}
    >
      <h2 className="font-display text-4xl">Site</h2>
      <Field label="Studio name" name="studioName" defaultValue={studio.studioName} />
      <Field label="Artist name" name="artistName" defaultValue={studio.artistName} />
      <Area label="Homepage introduction" name="hero" defaultValue={studio.hero} />
      <Area label="About" name="about" defaultValue={studio.about} rows={8} />
      <label className="grid gap-1 text-sm">
        About photo
        <input name="aboutPhoto" type="file" accept="image/*" className="min-h-11" />
      </label>
      <Field label="Public email" name="email" defaultValue={studio.email} />
      <Field label="Instagram" name="instagram" defaultValue={studio.instagram} />
      <Field label="Stripe donate link" name="donateUrl" defaultValue={studio.donateUrl} placeholder="https://buy.stripe.com/..." />
      <Field label="Shipping note" name="shippingNote" defaultValue={studio.shippingNote} />
      <Field label="Price note" name="negotiateNote" defaultValue={studio.negotiateNote} />
      <Field label="Future domain" name="plannedDomain" defaultValue={studio.plannedDomain} />
      {message ? <p className="text-sm">{message}</p> : null}
      <button type="submit" disabled={pending} className="min-h-11 bg-ink text-sm text-card disabled:opacity-60">
        {pending ? "Saving…" : "Save site"}
      </button>
    </form>
  );
}

function WorkForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <form
      className="grid gap-3 border border-line bg-card p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const file = data.get("photo");
        setPending(true);
        setMessage("");
        void (async () => {
          const imageSrc = file instanceof File && file.size > 0 ? await compressImage(file) : "";
          await createWork({
            data: {
              title: String(data.get("title") ?? ""),
              category: String(data.get("category") ?? "Original"),
              medium: String(data.get("medium") ?? ""),
              sizeLabel: String(data.get("sizeLabel") ?? ""),
              price: String(data.get("price") ?? ""),
              stripeUrl: String(data.get("stripeUrl") ?? ""),
              status: String(data.get("status") ?? "draft") as Work["status"],
              story: String(data.get("story") ?? ""),
              imageSrc,
              showInHero: data.get("showInHero") === "on",
            },
          });
          form.reset();
          await onCreated();
          setMessage("Piece added.");
        })()
          .catch((reason: unknown) => setMessage(reason instanceof Error ? reason.message : "Could not add that piece."))
          .finally(() => setPending(false));
      }}
    >
      <h2 className="font-display text-4xl">Add a piece</h2>
      <label className="grid gap-1 text-sm">
        Photo
        <input name="photo" type="file" accept="image/*" required className="min-h-11" />
      </label>
      <PieceFields />
      {message ? <p className="text-sm">{message}</p> : null}
      <button type="submit" disabled={pending} className="min-h-11 bg-ink text-sm text-card disabled:opacity-60">
        {pending ? "Adding…" : "Add piece"}
      </button>
    </form>
  );
}

function PieceEditor({ piece, onChanged }: { piece: Work; onChanged: () => Promise<void> }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <form
      className="grid gap-3 border border-line bg-card p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const file = data.get("photo");
        setPending(true);
        setMessage("");
        void (async () => {
          const imageSrc = file instanceof File && file.size > 0 ? await compressImage(file) : "";
          await updateWork({
            data: {
              id: piece.id,
              title: String(data.get("title") ?? ""),
              category: String(data.get("category") ?? ""),
              medium: String(data.get("medium") ?? ""),
              sizeLabel: String(data.get("sizeLabel") ?? ""),
              price: String(data.get("price") ?? ""),
              stripeUrl: String(data.get("stripeUrl") ?? ""),
              status: String(data.get("status") ?? "available") as Work["status"],
              story: String(data.get("story") ?? ""),
              imageSrc,
              showInHero: data.get("showInHero") === "on",
            },
          });
          await onChanged();
          setMessage("Updated.");
        })()
          .catch((reason: unknown) => setMessage(reason instanceof Error ? reason.message : "Could not update."))
          .finally(() => setPending(false));
      }}
    >
      <div className="flex items-start gap-4">
        <img src={piece.imageSrc} alt="" className="size-20 bg-cream object-contain" />
        <div>
          <p className="font-display text-3xl">{piece.title}</p>
          <p className="text-sm text-muted">{piece.status} · {money(piece.priceCents)}</p>
        </div>
      </div>
      <label className="grid gap-1 text-sm">
        Replace photo
        <input name="photo" type="file" accept="image/*" className="min-h-11" />
      </label>
      <PieceFields piece={piece} />
      {message ? <p className="text-sm">{message}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="min-h-11 bg-ink px-4 text-sm text-card disabled:opacity-60">
          Save piece
        </button>
        <button
          type="button"
          className="min-h-11 border border-line px-4 text-sm"
          onClick={() => {
            if (!confirm(`Remove ${piece.title}? This cannot be undone.`)) return;
            setPending(true);
            void deleteWork({ data: piece.id })
              .then(() => onChanged())
              .catch((reason: unknown) => setMessage(reason instanceof Error ? reason.message : "Could not remove it."))
              .finally(() => setPending(false));
          }}
        >
          Remove
        </button>
      </div>
    </form>
  );
}

function PieceFields({ piece }: { piece?: Work }) {
  const price = piece?.priceCents == null ? "" : (piece.priceCents / 100).toString();
  return (
    <>
      <Field label="Title" name="title" defaultValue={piece?.title} />
      <label className="grid gap-1 text-sm">
        Kind
        <select name="category" defaultValue={piece?.category ?? "Original"} className="min-h-11 border border-line bg-card px-3">
          {["Original", "Print", "Custom", "Wearable"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <Field label="Medium" name="medium" defaultValue={piece?.medium} placeholder="Acrylic, pencil, watercolor…" />
      <Field label="Size" name="sizeLabel" defaultValue={piece?.sizeLabel} placeholder="9 x 12 in" />
      <Field label="Price in dollars" name="price" defaultValue={price} placeholder="Leave blank to show Price on request" />
      <Field label="Stripe buy link" name="stripeUrl" defaultValue={piece?.stripeUrl} placeholder="https://buy.stripe.com/..." />
      <label className="grid gap-1 text-sm">
        Status
        <select name="status" defaultValue={piece?.status ?? "draft"} className="min-h-11 border border-line bg-card px-3">
          <option value="draft">Draft — hidden</option>
          <option value="available">Available</option>
          <option value="sold">Sold</option>
        </select>
      </label>
      <Area label="Note" name="story" defaultValue={piece?.story} />
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input name="showInHero" type="checkbox" defaultChecked={piece?.showInHero} className="size-4" />
        Show in hero
      </label>
    </>
  );
}

function Inquiries({ items }: { items: Inquiry[] }) {
  return (
    <section>
      <h2 className="font-display text-4xl">Custom notes</h2>
      {items.length === 0 ? <p className="mt-3 text-sm text-muted">No one has written yet.</p> : null}
      <ul className="mt-4 grid gap-3">
        {items.map((item) => (
          <li key={item.id} className="border border-line bg-card p-4 text-sm">
            <p className="font-medium">{item.name}</p>
            <a href={`mailto:${item.email}`} className="text-gold">{item.email}</a>
            <p className="mt-2 whitespace-pre-wrap">{item.message}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <input name={name} defaultValue={defaultValue} placeholder={placeholder} className="min-h-11 border border-line px-3" />
    </label>
  );
}

function Area({
  label,
  name,
  defaultValue,
  rows = 4,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <textarea name={name} defaultValue={defaultValue} rows={rows} className="border border-line px-3 py-2" />
    </label>
  );
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read that photo."));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const first = canvas.toDataURL("image/jpeg", 0.82);
      resolve(first.length > 1_200_000 ? canvas.toDataURL("image/jpeg", 0.62) : first);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that photo. Try a JPG or PNG."));
    };
    image.src = url;
  });
}
