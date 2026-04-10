import { TopNav } from "@/components/top-nav";
import { EmailAuthForm } from "@/components/email-auth-form";
import { GoogleAuthButton } from "@/components/google-auth-button";

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Login or Sign Up</h1>
        <p className="mt-2 text-slate-600">Use email/password or Google account.</p>
        <div className="mt-4 space-y-4">
          <EmailAuthForm />
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="mb-2 text-sm text-slate-700">Google login</p>
            <GoogleAuthButton />
          </div>
        </div>
      </main>
    </div>
  );
}
