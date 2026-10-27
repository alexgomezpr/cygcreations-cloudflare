-- Give alexgomezpr@hotmail.com a password login so Studio works without email.
-- Artwork is not touched. The other owner login is not touched.

delete from "session"
where "userId" in (
  select id from "user" where lower(email) = 'alexgomezpr@hotmail.com'
);

delete from "account"
where "userId" in (
  select id from "user" where lower(email) = 'alexgomezpr@hotmail.com'
);

delete from "verification"
where position('alexgomezpr@hotmail.com' in lower(identifier)) > 0;

delete from "user"
where lower(email) = 'alexgomezpr@hotmail.com';

insert into "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt")
values ('owner-hotmail', 'Cy Creations', 'alexgomezpr@hotmail.com', true, now(), now());

insert into "account" (
  "id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt"
) values (
  'owner-hotmail-credential',
  'owner-hotmail',
  'credential',
  'owner-hotmail',
  '76d519b737ad96f4be9c6d6c642d6a4d:de90a4746866ce8f851cb7ce8b55620dbb0ca692ff800a32e00a2dc4caa2bfb2f21328e1531d4bbe4141bd12ea23acc8ac3227e61b69ecfe8e04ce3554308e15',
  now(),
  now()
);
