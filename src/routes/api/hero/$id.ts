import { createFileRoute } from "@tanstack/react-router";
import { heroJpeg } from "@/lib/hero-image.server";

export const Route = createFileRoute("/api/hero/$id")({
  server: {
    handlers: {
      GET: ({ request, params }) => {
        const width = Number(new URL(request.url).searchParams.get("w") ?? 720);
        return heroJpeg(Number(params.id), width, request.url);
      },
    },
  },
});
