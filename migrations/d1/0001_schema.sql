create table if not exists "user" (
  "id" text not null primary key,
  "name" text not null,
  "email" text not null unique,
  "emailVerified" integer not null default 0,
  "image" text,
  "createdAt" text not null default (datetime('now')),
  "updatedAt" text not null default (datetime('now'))
);

create table if not exists "session" (
  "id" text not null primary key,
  "expiresAt" text not null,
  "token" text not null unique,
  "createdAt" text not null default (datetime('now')),
  "updatedAt" text not null default (datetime('now')),
  "ipAddress" text,
  "userAgent" text,
  "userId" text not null references "user" ("id") on delete cascade
);

create table if not exists "account" (
  "id" text not null primary key,
  "accountId" text not null,
  "providerId" text not null,
  "userId" text not null references "user" ("id") on delete cascade,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" text,
  "refreshTokenExpiresAt" text,
  "scope" text,
  "password" text,
  "createdAt" text not null default (datetime('now')),
  "updatedAt" text not null default (datetime('now'))
);

create table if not exists "verification" (
  "id" text not null primary key,
  "identifier" text not null,
  "value" text not null,
  "expiresAt" text not null,
  "createdAt" text not null default (datetime('now')),
  "updatedAt" text not null default (datetime('now'))
);

create index if not exists "session_userId_idx" on "session" ("userId");
create index if not exists "account_userId_idx" on "account" ("userId");
create index if not exists "verification_identifier_idx" on "verification" ("identifier");

create table if not exists studio (
  id integer primary key,
  studio_name text not null,
  artist_name text not null,
  hero text not null,
  about text not null,
  email text not null,
  instagram text not null,
  donate_url text not null default '',
  shipping_note text not null,
  negotiate_note text not null,
  planned_domain text not null default 'cygcreations.com',
  about_image text not null default ''
);

create table if not exists works (
  id integer primary key autoincrement,
  user_id text not null,
  title text not null,
  category text not null,
  medium text not null default '',
  size_label text not null default '',
  price_cents integer,
  stripe_url text not null default '',
  status text not null default 'available',
  story text not null default '',
  image_src text not null,
  show_in_hero integer not null default 0,
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);

create table if not exists inquiries (
  id integer primary key autoincrement,
  name text not null,
  email text not null,
  message text not null,
  created_at text not null default (datetime('now'))
);

create table if not exists sign_in_limit (
  key text primary key,
  count integer not null,
  window_started text not null
);

insert into studio (
  id, studio_name, artist_name, hero, about, email, instagram, shipping_note, negotiate_note, planned_domain
) values (
  1,
  'Cy Creations',
  'Caro Gomez',
  'Welcome to Cy Creations — a creative studio by Caro Gomez, where personal visions become original artwork, handmade creations, and designs made to be remembered.',
  'I was born and raised in San Juan, Puerto Rico. I am a young artist who loves expressing ideas, creativity, and a unique perspective through art and different creative mediums.',
  'cygcreationss@gmail.com',
  'cygcreationss',
  'Caro ships each piece.',
  'Prices are listed on the page. To negotiate, contact the designer.',
  'cygcreations.com'
) on conflict (id) do nothing;
