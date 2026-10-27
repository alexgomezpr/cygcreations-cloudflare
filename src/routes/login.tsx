import { createFileRoute } from "@tanstack/react-router";
import { OwnerPortal, portalSearch } from "@/components/owner-portal";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/login")({
  validateSearch: portalSearch,
  component: Login,
  head: () =>
    seoHead({
      title: "Owner portal · Cy Creations",
      description: "Sign in to manage your site.",
      path: "/login",
      noindex: true,
    }),
});

function Login() {
  const search = Route.useSearch();
  return <OwnerPortal search={search} />;
}
