import { TopNav } from "@/components/top-nav";
import { CheckInForm } from "@/components/checkin-form";

export default function CheckinPage() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Attitude Check-in</h1>
        <p className="mt-2 text-slate-600">
          Report your current focus and confidence so the agent can intervene earlier.
        </p>
        <CheckInForm />
      </main>
    </div>
  );
}
