"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, controlClass, Field, Notice } from "@/components/ui";
import { api, errorText } from "@/lib/api";
import { useAuthDispatch, useSession } from "@/lib/queries";
import { Logo } from "./logo";

function safeNext(value: string | null, fallback = "/account") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

function passwordIssue(password: string): string | null {
  if (password.length < 8) return "Use at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Include a letter and a number.";
  return null;
}

export function LoginScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const next = safeNext(params.get("next"));
  const session = useSession();
  const auth = useAuthDispatch();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (session.hydrated && session.accessToken) router.replace(next);
  }, [session.hydrated, session.accessToken, next, router]);

  return (
    <AuthFrame title="Welcome back." lede="Sign in to see orders, saved addresses, and the cart that follows you.">
      <form
        className="grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setError(null);
          setPending(true);
          try {
            const result = await api.login({
              email: String(data.get("email") ?? ""),
              password: String(data.get("password") ?? ""),
              ...(session.cartToken ? { cartToken: session.cartToken } : {}),
            });
            auth.save(result);
            router.push(next);
          } catch (reason) {
            setError(errorText(reason));
          } finally {
            setPending(false);
          }
        }}
      >
        <Field label="Email">
          <input name="email" type="email" required autoComplete="email" className={controlClass} />
        </Field>
        <Field label="Password">
          <input name="password" type="password" required autoComplete="current-password" className={controlClass} />
        </Field>
        {error ? <Notice>{error}</Notice> : null}
        <Button type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</Button>
        <p className="text-sm text-stone">
          <Link href="/forgot-password" className="underline">Forgot password</Link>
          <span className="mx-2">·</span>
          <Link href={`/register?next=${encodeURIComponent(next)}`} className="underline">Create an account</Link>
        </p>
      </form>
    </AuthFrame>
  );
}

export function RegisterScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const next = safeNext(params.get("next"), "/account");
  const session = useSession();
  const auth = useAuthDispatch();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <AuthFrame title="Open an account." lede="Your guest basket comes with you. We only deliver to US addresses.">
      <form
        className="grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const password = String(data.get("password") ?? "");
          const issue = passwordIssue(password);
          if (issue) {
            setError(issue);
            return;
          }
          setError(null);
          setPending(true);
          try {
            const phone = String(data.get("phone") ?? "").trim();
            const result = await api.register({
              email: String(data.get("email") ?? ""),
              password,
              firstName: String(data.get("firstName") ?? ""),
              lastName: String(data.get("lastName") ?? ""),
              ...(phone ? { phone } : {}),
              marketingOptIn: data.get("marketingOptIn") === "on",
              ...(session.cartToken ? { cartToken: session.cartToken } : {}),
            });
            auth.save(result);
            router.push(next);
          } catch (reason) {
            setError(errorText(reason));
          } finally {
            setPending(false);
          }
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name">
            <input name="firstName" required autoComplete="given-name" className={controlClass} />
          </Field>
          <Field label="Last name">
            <input name="lastName" required autoComplete="family-name" className={controlClass} />
          </Field>
        </div>
        <Field label="Email">
          <input name="email" type="email" required autoComplete="email" className={controlClass} />
        </Field>
        <Field label="Phone" hint="Optional. A US number if you add one.">
          <input name="phone" autoComplete="tel" className={controlClass} />
        </Field>
        <Field label="Password" hint="At least 8 characters, with a letter and a number.">
          <input name="password" type="password" required autoComplete="new-password" className={controlClass} />
        </Field>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="marketingOptIn" className="mt-1" />
          Email me about new arrivals. You can turn this off later.
        </label>
        {error ? <Notice>{error}</Notice> : null}
        <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create account"}</Button>
        <p className="text-sm text-stone">
          Already shopping with us? <Link href={`/login?next=${encodeURIComponent(next)}`} className="underline">Sign in</Link>
        </p>
      </form>
    </AuthFrame>
  );
}

export function ForgotScreen() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <AuthFrame title="Reset your password." lede="If an account exists for that email, a link is on the way. It expires in 30 minutes.">
      <form
        className="grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setPending(true);
          setError(null);
          try {
            const result = await api.forgotPassword(String(data.get("email") ?? ""));
            setMessage(result.message);
          } catch (reason) {
            setError(errorText(reason));
          } finally {
            setPending(false);
          }
        }}
      >
        <Field label="Email">
          <input name="email" type="email" required autoComplete="email" className={controlClass} />
        </Field>
        {message ? <Notice tone="ok">{message}</Notice> : null}
        {error ? <Notice>{error}</Notice> : null}
        <Button type="submit" disabled={pending}>{pending ? "Sending…" : "Send reset link"}</Button>
        <Link href="/login" className="text-sm text-stone underline">Back to sign in</Link>
      </form>
    </AuthFrame>
  );
}

export function ResetScreen() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <AuthFrame title="Choose a new password." lede="This replaces the old one and signs you out everywhere.">
      {!token ? <Notice>This reset link is missing its token. Request a new one.</Notice> : null}
      <form
        className="grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const password = String(new FormData(event.currentTarget).get("password") ?? "");
          const issue = passwordIssue(password);
          if (issue) {
            setError(issue);
            return;
          }
          setPending(true);
          setError(null);
          try {
            await api.resetPassword({ token, password });
            router.push("/login");
          } catch (reason) {
            setError(errorText(reason));
          } finally {
            setPending(false);
          }
        }}
      >
        <Field label="New password" hint="At least 8 characters, with a letter and a number.">
          <input name="password" type="password" required autoComplete="new-password" className={controlClass} />
        </Field>
        {error ? <Notice>{error}</Notice> : null}
        <Button type="submit" disabled={pending || !token}>{pending ? "Saving…" : "Update password"}</Button>
      </form>
    </AuthFrame>
  );
}

function AuthFrame({ title, lede, children }: { title: string; lede: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-6xl items-stretch gap-8 px-4 py-10 lg:grid-cols-2">
      <div className="cloth hidden flex-col justify-between rounded-lg p-8 text-cream lg:flex">
        <Logo />
        <div>
          <p className="font-display text-5xl leading-[0.95]">{title}</p>
          <p className="mt-4 max-w-sm text-cream/80">{lede}</p>
        </div>
        <p className="text-sm text-gold">US addresses · USD · African groceries</p>
      </div>
      <div className="flex flex-col justify-center">
        <h1 className="font-display text-4xl text-forest lg:hidden">{title}</h1>
        <p className="mt-2 text-sm text-stone lg:hidden">{lede}</p>
        <div className="mt-6 lg:mt-0">{children}</div>
      </div>
    </div>
  );
}
