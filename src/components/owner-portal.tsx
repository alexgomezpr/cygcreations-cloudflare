import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { setPortalPassword } from "@/lib/auth/portal.functions";

const SETUP_SENT = "If this email can manage the site, a setup link is on its way.";
const RESET_SENT = "If this email can manage the site, a reset link is on its way.";
const WAIT = "Please wait a few minutes and try again.";
const BAD_LINK = "That link is no longer valid. Request a new one.";
const BAD_MATCH = "That email and password didn't match.";

export type PortalSearch = { token: string; setup: string; error: string };

export function portalSearch(search: Record<string, unknown>): PortalSearch {
  const error = search.error === "link" || search.error === "signin" ? search.error : "";
  return {
    token: typeof search.token === "string" ? search.token.slice(0, 256) : "",
    setup: search.setup === "1" ? "1" : "",
    error,
  };
}

function noticeFor(error: string) {
  if (error === "link") return BAD_LINK;
  if (error === "signin") return "That sign-in didn't open the studio.";
  return "";
}

async function postAuth(path: string, body: Record<string, unknown>) {
  return fetch(`/api/auth/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
}

export function OwnerPortal({ search }: { search: PortalSearch }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState(noticeFor(search.error));
  const [tone, setTone] = useState<"muted" | "sold">(search.error ? "sold" : "muted");
  const choosing = search.token.length > 0;

  function say(text: string, next: "muted" | "sold" = "muted") {
    setMessage(text);
    setTone(next);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const intent = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") ?? "sign-in";
    setPending(true);
    setMessage("");
    try {
      if (choosing || intent === "choose" || intent === "sign-in") {
        if (password.length < 8) {
          say("Use at least 8 characters.", "sold");
          return;
        }
      }
      if (choosing || intent === "choose") {
        const response = await postAuth("reset-password", { newPassword: password, token: search.token });
        if (response.status === 429) {
          say(WAIT, "sold");
          return;
        }
        if (!response.ok) {
          say(BAD_LINK, "sold");
          return;
        }
        say("Password updated. Sign in to manage your site.");
        setPassword("");
        void navigate({ to: "/studio", search: { token: "", setup: "", error: "" }, replace: true });
        return;
      }
      if (intent === "setup") {
        const response = await postAuth("sign-in/magic-link", {
          email,
          callbackURL: "/studio?setup=1",
          errorCallbackURL: "/studio?error=link",
        });
        say(response.status === 429 ? WAIT : SETUP_SENT, response.status === 429 ? "sold" : "muted");
        return;
      }
      if (intent === "reset") {
        const response = await postAuth("request-password-reset", { email, redirectTo: "/studio" });
        say(response.status === 429 ? WAIT : RESET_SENT, response.status === 429 ? "sold" : "muted");
        return;
      }
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        const status = result.error.status;
        const code = result.error.code ?? "";
        say(status === 429 || code === "TOO_MANY_REQUESTS" ? WAIT : BAD_MATCH, "sold");
        return;
      }
      void navigate({ to: "/studio", search: { token: "", setup: "", error: "" } });
    } catch {
      say("Something went wrong. Try again.", "sold");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center overflow-x-clip bg-paper px-5 py-12">
      <div className="w-full max-w-md bg-card p-6 shadow-[0_20px_50px_rgba(38,38,36,0.06)] sm:p-8">
        <img src="/brand/cy-logo-wordmark-on-fffefa.jpg" alt="Cy Creations" className="mx-auto h-24 w-auto" />
        <h1 className="mt-4 text-center font-display text-4xl">Owner portal</h1>
        <p className="mt-2 text-center text-sm text-muted">
          {choosing ? "Choose a new password." : "Sign in to manage your site."}
        </p>
        <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
          {choosing ? null : (
            <label className="grid gap-1 text-sm">
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="min-h-11 border border-line bg-paper px-3"
              />
            </label>
          )}
          {choosing ? (
            <PasswordField
              label="New password"
              autoComplete="new-password"
              show={showPassword}
              onToggle={() => setShowPassword((value) => !value)}
              value={password}
              onChange={setPassword}
            />
          ) : (
            <PasswordField
              label="Password"
              autoComplete="current-password"
              show={showPassword}
              onToggle={() => setShowPassword((value) => !value)}
              value={password}
              onChange={setPassword}
            />
          )}
          {message ? <p className={`text-sm ${tone === "sold" ? "text-sold" : "text-muted"}`}>{message}</p> : null}
          {choosing ? (
            <button type="submit" value="choose" disabled={pending} className="min-h-11 bg-ink text-sm text-card disabled:opacity-60">
              {pending ? "Please wait…" : "Save password"}
            </button>
          ) : (
            <>
              <button type="submit" value="sign-in" disabled={pending} className="min-h-11 bg-ink text-sm text-card disabled:opacity-60">
                {pending ? "Please wait…" : "Sign in"}
              </button>
              <button type="submit" value="reset" disabled={pending} className="min-h-11 text-sm underline disabled:opacity-60">
                Forgot password?
              </button>
              <button type="submit" value="setup" disabled={pending} className="min-h-11 border border-line text-sm disabled:opacity-60">
                Email me a setup link
              </button>
            </>
          )}
        </form>
      </div>
    </main>
  );
}

export function ChoosePassword({ onSaved }: { onSaved: () => void }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <main className="grid min-h-screen place-items-center overflow-x-clip bg-paper px-5 py-12">
      <form
        className="grid w-full max-w-md gap-3 bg-card p-6 shadow-[0_20px_50px_rgba(38,38,36,0.06)] sm:p-8"
        onSubmit={(event) => {
          event.preventDefault();
          setPending(true);
          setMessage("");
          void setPortalPassword({ data: { password } })
            .then(() => onSaved())
            .catch((reason: unknown) => {
              setMessage(reason instanceof Error ? reason.message : "Could not save that password.");
              setPending(false);
            });
        }}
      >
        <h1 className="text-center font-display text-4xl">Owner portal</h1>
        <p className="text-center text-sm text-muted">Choose a password for this portal.</p>
        <PasswordField
          label="Password"
          autoComplete="new-password"
          show={showPassword}
          onToggle={() => setShowPassword((value) => !value)}
          value={password}
          onChange={setPassword}
        />
        {message ? <p className="text-sm text-sold">{message}</p> : null}
        <button type="submit" disabled={pending} className="min-h-11 bg-ink text-sm text-card disabled:opacity-60">
          {pending ? "Please wait…" : "Save password"}
        </button>
      </form>
    </main>
  );
}

function PasswordField({
  label,
  autoComplete,
  show,
  onToggle,
  value,
  onChange,
}: {
  label: string;
  autoComplete: string;
  show: boolean;
  onToggle: () => void;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <span className="relative block">
        <input
          name="password"
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-11 w-full border border-line bg-paper px-3 pr-12"
        />
        <button
          type="button"
          className="absolute top-0 right-0 inline-flex size-11 items-center justify-center text-muted"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={onToggle}
        >
          {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </span>
    </label>
  );
}
