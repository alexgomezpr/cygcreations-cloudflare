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
  constraint studio_singleton check (id = 1)
);

insert into studio (
  id, studio_name, artist_name, hero, about, email, instagram, shipping_note, negotiate_note, planned_domain
) values (
  1,
  'Cy Creations',
  'Caro Gomez',
  'Welcome to Cy Creations — a creative studio by Caro Gomez, where personal visions become original artwork, handmade creations, and designs made to be remembered.',
  $about$I was born and raised in San Juan, Puerto Rico. I am a young artist who loves expressing ideas, creativity, and a unique perspective through art and different creative mediums.

Cy Creations is a space where I can share that creativity with others. Each piece is an extension of my imagination and a way for me to connect with people through the things I create. On special occasions, once discussed, I can make specialized artworks.

As I continue growing as an artist, every purchase helps me keep creating, learning, and exploring new ideas — while also helping me work toward one of my biggest dreams: seeing and experiencing more of the world and bringing those experiences back into my art.$about$,
  'cygcreationss@gmail.com',
  'cygcreationss',
  'Caro ships each piece.',
  'Prices are listed on the page. To negotiate, contact the designer.',
  'cygcreations.com'
) on conflict (id) do nothing;

create table if not exists works (
  id serial primary key,
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint works_status_chk check (status in ('draft', 'available', 'sold'))
);

create index if not exists works_status_idx on works (status, id);

insert into works (user_id, title, category, medium, size_label, status, story, image_src)
select 'seed', 'Floral Study', 'Original', 'Colored pencil', '', 'available',
  'A floral drawing on paper. Title, size, and price can be updated from Studio.',
  '/art/floral.jpg'
where not exists (select 1 from works where image_src = '/art/floral.jpg');

insert into works (user_id, title, category, medium, size_label, status, story, image_src)
select 'seed', 'Hibiscus Tote', 'Original', 'Acrylic on canvas tote', '', 'available',
  'A hand-painted tote. Title, size, and price can be updated from Studio.',
  '/art/tote.jpg'
where not exists (select 1 from works where image_src = '/art/tote.jpg');

insert into works (user_id, title, category, medium, size_label, status, story, image_src)
select 'seed', 'Calle', 'Original', 'Acrylic on canvas', '', 'available',
  'An acrylic street scene. Title, size, and price can be updated from Studio.',
  '/art/street.jpg'
where not exists (select 1 from works where image_src = '/art/street.jpg');

insert into works (user_id, title, category, medium, size_label, status, story, image_src)
select 'seed', 'Puerto Rico Sanse', 'Original', 'Mixed media on canvas', '', 'available',
  'A Puerto Rico piece. Title, size, and price can be updated from Studio.',
  '/art/sanse.jpg'
where not exists (select 1 from works where image_src = '/art/sanse.jpg');

create table if not exists inquiries (
  id serial primary key,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);
