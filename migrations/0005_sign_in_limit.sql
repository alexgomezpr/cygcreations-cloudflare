create table if not exists sign_in_limit (
  key text primary key,
  count integer not null,
  window_started timestamptz not null
);
