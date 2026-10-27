import { createFileRoute } from "@tanstack/react-router";
import { aboutJpeg } from "@/lib/about-photo.server";

export const Route = createFileRoute("/api/about-photo")({
  server: {
    handlers: {
      GET: ({ request }) => aboutJpeg(Number(new URL(request.url).searchParams.get("w") ?? 720)),
    },
  },
});
