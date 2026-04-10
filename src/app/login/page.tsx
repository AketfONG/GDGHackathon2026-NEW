import { TopNav } from "@/components/top-nav";
import { EmailAuthForm } from "@/components/email-auth-form";
import { GoogleAuthButton } from "@/components/google-auth-button";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav />
      <main className="mx-auto w-full max-w-md px-4 py-12">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h1 className="text-2xl font-semibold text-slate-900">Log in</h1>
          <p className="mt-2 text-sm text-slate-600">
            Welcome back. Or sign up using the text link below the fields.
          </p>
          <div className="mt-5 space-y-4">
            <EmailAuthForm />
            <div className="border-t border-slate-200 pt-4">
              <p className="mb-2 text-sm text-slate-700">Sign in with Google</p>
              <GoogleAuthButton />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
