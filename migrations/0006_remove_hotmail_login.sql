-- Drop the alexgomezpr@hotmail.com login so it can be created again.
-- Studio content is not tied to this user and is left in place.

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
