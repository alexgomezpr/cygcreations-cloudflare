import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { httpsUrl, parsePrice } from "@/lib/money";

export type StudioProfile = {
  studioName: string;
  artistName: string;
  hero: string;
  about: string;
  email: string;
  instagram: string;
  donateUrl: string;
  shippingNote: string;
  negotiateNote: string;
  plannedDomain: string;
  hasAboutPhoto: boolean;
  aboutPhotoVersion: number;
};

export type Work = {
  id: number;
  title: string;
  category: string;
  medium: string;
  sizeLabel: string;
  priceCents: number | null;
  stripeUrl: string;
  status: "draft" | "available" | "sold";
  story: string;
  imageSrc: string;
  showInHero: boolean;
};

export type Inquiry = {
  id: number;
  name: string;
  email: string;
  message: string;
  createdAt: string;
};

type StudioRow = {
  studio_name: string;
  artist_name: string;
  hero: string;
  about: string;
  email: string;
  instagram: string;
  donate_url: string;
  shipping_note: string;
  negotiate_note: string;
  planned_domain: string;
  has_about_photo: boolean;
  about_photo_version: number;
};

type WorkRow = {
  id: number;
  title: string;
  category: string;
  medium: string;
  size_label: string;
  price_cents: number | null;
  stripe_url: string;
  status: string;
  story: string;
  image_src: string;
  show_in_hero: boolean;
};

function profile(row: StudioRow): StudioProfile {
  return {
    studioName: row.studio_name,
    artistName: row.artist_name,
    hero: row.hero,
    about: row.about,
    email: row.email,
    instagram: row.instagram,
    donateUrl: row.donate_url,
    shippingNote: row.shipping_note,
    negotiateNote: row.negotiate_note,
    plannedDomain: row.planned_domain,
    hasAboutPhoto: row.has_about_photo === true || Number(row.has_about_photo) === 1,
    aboutPhotoVersion: Number(row.about_photo_version ?? 0),
  };
}

function work(row: WorkRow): Work {
  const status = row.status === "draft" || row.status === "sold" ? row.status : "available";
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    medium: row.medium,
    sizeLabel: row.size_label,
    priceCents: row.price_cents,
    stripeUrl: row.stripe_url,
    status,
    story: row.story,
    imageSrc: row.image_src,
    showInHero: row.show_in_hero === true || Number(row.show_in_hero) === 1,
  };
}

async function requireArtist(userId: string) {
  const { isOwnerEmail } = await import("@/lib/auth/owners.server");
  const sql = await getSql();
  const rows = await sql.query<{ email: string }>(
    'select email from "user" where id = $1',
    [userId],
  );
  const email = (rows[0]?.email ?? "").toLowerCase();
  if (!isOwnerEmail(email)) {
    throw new Error("This studio login cannot edit Cy Creations.");
  }
  return { sql, email, userId };
}

function text(value: unknown, max: number, label: string) {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  if (clean.length > max) throw new Error(`${label} is too long.`);
  return clean;
}

function multiline(value: unknown, max: number, label: string) {
  const clean = String(value ?? "").replace(/\r\n/g, "\n").trim();
  if (clean.length > max) throw new Error(`${label} is too long.`);
  return clean;
}

async function assertHeroRoom(sql: Awaited<ReturnType<typeof getSql>>, showInHero: boolean, exceptId = 0) {
  if (!showInHero) return;
  const rows = await sql<{ n: number }>`select count(*)::int as n from works where show_in_hero = true and id <> ${exceptId}`;
  if (Number(rows[0]?.n ?? 0) >= 6) throw new Error("You can show 6 pieces in the hero.");
}

function statusOf(value: unknown): Work["status"] {
  if (value === "draft" || value === "sold" || value === "available") return value;
  throw new Error("Choose draft, available, or sold.");
}

type WorkInput = {
  title: string;
  category: string;
  medium: string;
  sizeLabel: string;
  price: string;
  stripeUrl: string;
  status: Work["status"];
  story: string;
  imageSrc: string;
  showInHero: boolean;
};

function workInput(value: unknown, imageRequired: boolean): WorkInput {
  const raw = (value ?? {}) as Record<string, unknown>;
  const title = text(raw.title, 120, "Title");
  if (!title) throw new Error("Add a title.");
  const imageSrc = String(raw.imageSrc ?? "").trim();
  if (imageRequired && !imageSrc) throw new Error("Add a photo.");
  if (imageSrc.startsWith("data:") && imageSrc.length > 1_400_000) {
    throw new Error("That photo is too large. Try a smaller JPG.");
  }
  if (imageSrc && !imageSrc.startsWith("/") && !imageSrc.startsWith("data:image/")) {
    throw new Error("That photo could not be saved.");
  }
  return {
    title,
    category: text(raw.category, 40, "Category") || "Original",
    medium: text(raw.medium, 80, "Medium"),
    sizeLabel: text(raw.sizeLabel, 40, "Size"),
    price: String(raw.price ?? ""),
    stripeUrl: httpsUrl(String(raw.stripeUrl ?? "")),
    status: statusOf(raw.status),
    story: multiline(raw.story, 2000, "Note"),
    imageSrc,
    showInHero: raw.showInHero === true,
  };
}

export const getStudio = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql<StudioRow>`select studio_name, artist_name, hero, about, email, instagram, donate_url, shipping_note, negotiate_note, planned_domain, (about_image <> '') as has_about_photo, length(about_image) as about_photo_version from studio where id = 1`;
  if (!rows[0]) throw new Error("Studio is not ready.");
  return profile(rows[0]);
});

export const listPublicWorks = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql<WorkRow>`select id, title, category, medium, size_label, price_cents, stripe_url, status, story, image_src, show_in_hero from works where status <> 'draft' order by id asc`;
  return rows.map(work);
});

export const getPublicWork = createServerFn({ method: "GET" })
  .validator((id: number) => {
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed < 1) throw new Error("Missing piece.");
    return parsed;
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql<WorkRow>`select id, title, category, medium, size_label, price_cents, stripe_url, status, story, image_src, show_in_hero from works where id = ${data} and status <> 'draft'`;
    return rows[0] ? work(rows[0]) : null;
  });

export const sendInquiry = createServerFn({ method: "POST" })
  .validator((input: { name: string; email: string; message: string }) => {
    const name = text(input?.name, 80, "Name");
    const email = text(input?.email, 120, "Email").toLowerCase();
    const message = multiline(input?.message, 2000, "Message");
    if (!name || !email || !message) throw new Error("Name, email, and a note are required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error("Enter a real email address.");
    return { name, email, message };
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`insert into inquiries (name, email, message) values (${data.name}, ${data.email}, ${data.message})`;
    return { ok: true };
  });

export const getStudioAdmin = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { sql, email } = await requireArtist(context.userId);
    const studioRows = await sql<StudioRow>`select studio_name, artist_name, hero, about, email, instagram, donate_url, shipping_note, negotiate_note, planned_domain, (about_image <> '') as has_about_photo, length(about_image) as about_photo_version from studio where id = 1`;
    const workRows = await sql<WorkRow>`select id, title, category, medium, size_label, price_cents, stripe_url, status, story, image_src, show_in_hero from works order by id desc`;
    const inquiryRows = await sql<{ id: number; name: string; email: string; message: string; created_at: string }>`select id, name, email, message, created_at::text as created_at from inquiries order by id desc limit 30`;
    return {
      email,
      studio: profile(studioRows[0]),
      works: workRows.map(work),
      inquiries: inquiryRows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        message: row.message,
        createdAt: row.created_at,
      })) satisfies Inquiry[],
    };
  });

export const saveStudio = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: StudioProfile & { aboutImage?: string }) => {
    const studioName = text(input?.studioName, 80, "Studio name");
    const artistName = text(input?.artistName, 80, "Artist name");
    if (!studioName || !artistName) throw new Error("Studio name and artist name are required.");
    const aboutImage = String(input?.aboutImage ?? "").trim();
    if (aboutImage && !aboutImage.startsWith("data:image/")) throw new Error("That photo could not be saved.");
    if (aboutImage.length > 1_400_000) throw new Error("That photo is too large. Try a smaller JPG.");
    return {
      studioName,
      artistName,
      hero: multiline(input?.hero, 500, "Introduction"),
      about: multiline(input?.about, 4000, "About"),
      email: text(input?.email, 120, "Email"),
      instagram: text(input?.instagram, 60, "Instagram").replace(/^@/, ""),
      donateUrl: httpsUrl(String(input?.donateUrl ?? "")),
      shippingNote: text(input?.shippingNote, 240, "Shipping note"),
      negotiateNote: text(input?.negotiateNote, 240, "Price note"),
      plannedDomain: text(input?.plannedDomain, 80, "Domain"),
      hasAboutPhoto: input?.hasAboutPhoto === true || aboutImage.length > 0,
      aboutPhotoVersion: aboutImage ? aboutImage.length : Number(input?.aboutPhotoVersion ?? 0),
      aboutImage,
    };
  })
  .handler(async ({ context, data }) => {
    const { sql } = await requireArtist(context.userId);
    await sql`update studio set
      studio_name = ${data.studioName},
      artist_name = ${data.artistName},
      hero = ${data.hero},
      about = ${data.about},
      email = ${data.email},
      instagram = ${data.instagram},
      donate_url = ${data.donateUrl},
      shipping_note = ${data.shippingNote},
      negotiate_note = ${data.negotiateNote},
      planned_domain = ${data.plannedDomain}
      where id = 1`;
    if (data.aboutImage) {
      await sql`update studio set about_image = ${data.aboutImage} where id = 1`;
    }
    return { ok: true };
  });

export const createWork = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: WorkInput) => workInput(input, true))
  .handler(async ({ context, data }) => {
    const { sql, userId } = await requireArtist(context.userId);
    const price = parsePrice(data.price);
    await assertHeroRoom(sql, data.showInHero);
    const rows = await sql<{ id: number }>`insert into works
      (user_id, title, category, medium, size_label, price_cents, stripe_url, status, story, image_src, show_in_hero)
      values (${userId}, ${data.title}, ${data.category}, ${data.medium}, ${data.sizeLabel}, ${price}, ${data.stripeUrl}, ${data.status}, ${data.story}, ${data.imageSrc}, ${data.showInHero})
      returning id`;
    return { id: rows[0]?.id ?? 0 };
  });

export const updateWork = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: WorkInput & { id: number }) => {
    const id = Number(input?.id);
    if (!Number.isInteger(id) || id < 1) throw new Error("Missing piece.");
    return { id, ...workInput(input, false) };
  })
  .handler(async ({ context, data }) => {
    const { sql, userId } = await requireArtist(context.userId);
    const price = parsePrice(data.price);
    const current = await sql<{ image_src: string }>`select image_src from works where id = ${data.id}`;
    if (!current[0]) throw new Error("That piece is gone.");
    const imageSrc = data.imageSrc || current[0].image_src;
    await assertHeroRoom(sql, data.showInHero, data.id);
    await sql`update works set
      user_id = ${userId},
      title = ${data.title},
      category = ${data.category},
      medium = ${data.medium},
      size_label = ${data.sizeLabel},
      price_cents = ${price},
      stripe_url = ${data.stripeUrl},
      status = ${data.status},
      story = ${data.story},
      image_src = ${imageSrc},
      show_in_hero = ${data.showInHero},
      updated_at = now()
      where id = ${data.id}`;
    return { ok: true };
  });

export const deleteWork = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: number) => {
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed < 1) throw new Error("Missing piece.");
    return parsed;
  })
  .handler(async ({ context, data }) => {
    const { sql } = await requireArtist(context.userId);
    await sql`delete from works where id = ${data}`;
    return { ok: true };
  });

export const exportSiteData = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { sql } = await requireArtist(context.userId);
    const studio = await sql<Record<string, unknown>>`select * from studio where id = 1`;
    const works = await sql<Record<string, unknown>>`select * from works order by id asc`;
    const inquiries = await sql<Record<string, unknown>>`select * from inquiries order by id asc`;
    const users = await sql.query<Record<string, unknown>>(
      'select id, name, email, "emailVerified", image, "createdAt", "updatedAt" from "user" order by email',
    );
    const accounts = await sql.query<Record<string, unknown>>(
      'select id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt" from "account" where "providerId" = $1 order by id',
      ["credential"],
    );
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      studio: studio[0] ?? null,
      works,
      inquiries,
      users,
      accounts,
    };
  });

type SiteCopy = {
  version: number;
  studio: Record<string, unknown> | null;
  works: Record<string, unknown>[];
  inquiries: Record<string, unknown>[];
  users: Record<string, unknown>[];
  accounts: Record<string, unknown>[];
};

function asText(value: unknown) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function flag(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "t" || value === "true" ? 1 : 0;
}

export const siteNeedsImport = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql.query<{ n: number }>('select count(*) as n from "account"');
  return { needsImport: Number(rows[0]?.n ?? 0) === 0 };
});

export const importSiteData = createServerFn({ method: "POST" })
  .validator((input: SiteCopy) => {
    if (input?.version !== 1 || !input.studio || !Array.isArray(input.works) || !Array.isArray(input.accounts)) {
      throw new Error("That file is not a Cy Creations site copy.");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const sql = await getSql();
    const existing = await sql.query<{ n: number }>('select count(*) as n from "account"');
    if (Number(existing[0]?.n ?? 0) > 0) throw new Error("This Cloudflare site already has a login. Import only works on an empty database.");
    const studio = data.studio;
    await sql.query('delete from "session"');
    await sql.query('delete from "account"');
    await sql.query('delete from "user"');
    await sql.query("delete from works");
    await sql.query("delete from inquiries");
    await sql.query(
      `update studio set studio_name = $1, artist_name = $2, hero = $3, about = $4, email = $5, instagram = $6, donate_url = $7, shipping_note = $8, negotiate_note = $9, planned_domain = $10, about_image = $11 where id = 1`,
      [
        asText(studio.studio_name),
        asText(studio.artist_name),
        asText(studio.hero),
        asText(studio.about),
        asText(studio.email),
        asText(studio.instagram),
        asText(studio.donate_url),
        asText(studio.shipping_note),
        asText(studio.negotiate_note),
        asText(studio.planned_domain || "cygcreations.com"),
        asText(studio.about_image),
      ],
    );
    for (const user of data.users ?? []) {
      await sql.query(
        `insert into "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt") values ($1, $2, $3, $4, $5, $6, $7)`,
        [
          asText(user.id),
          asText(user.name),
          asText(user.email),
          flag(user.emailVerified),
          user.image == null ? null : asText(user.image),
          asText(user.createdAt),
          asText(user.updatedAt),
        ],
      );
    }
    for (const account of data.accounts) {
      await sql.query(
        `insert into "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt") values ($1, $2, $3, $4, $5, $6, $7)`,
        [
          asText(account.id),
          asText(account.accountId),
          asText(account.providerId || "credential"),
          asText(account.userId),
          account.password == null ? null : asText(account.password),
          asText(account.createdAt),
          asText(account.updatedAt),
        ],
      );
    }
    for (const piece of data.works) {
      await sql.query(
        `insert into works (id, user_id, title, category, medium, size_label, price_cents, stripe_url, status, story, image_src, show_in_hero, created_at, updated_at) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          Number(piece.id),
          asText(piece.user_id || "seed"),
          asText(piece.title),
          asText(piece.category),
          asText(piece.medium),
          asText(piece.size_label),
          piece.price_cents == null || piece.price_cents === "" ? null : Number(piece.price_cents),
          asText(piece.stripe_url),
          asText(piece.status || "available"),
          asText(piece.story),
          asText(piece.image_src),
          flag(piece.show_in_hero),
          asText(piece.created_at),
          asText(piece.updated_at),
        ],
      );
    }
    for (const note of data.inquiries ?? []) {
      await sql.query("insert into inquiries (id, name, email, message, created_at) values ($1, $2, $3, $4, $5)", [
        Number(note.id),
        asText(note.name),
        asText(note.email),
        asText(note.message),
        asText(note.created_at),
      ]);
    }
    return { ok: true };
  });
