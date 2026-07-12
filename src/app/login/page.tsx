import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { TransitOpsLogo } from "@/components/brand-logo";
import { LoginForm } from "@/components/forms/login-form";
import { authOptions } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.1fr_0.9fr]">
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <TransitOpsLogo />
            <h1 className="mt-6 text-3xl font-semibold tracking-normal">Sign in to TransitOps</h1>
            <p className="mt-2 text-sm text-muted-foreground">Use one of the demo role accounts to manage fleet operations end to end.</p>
          </div>
          <LoginForm />
        </div>
      </section>
      <section className="hidden border-l bg-card lg:block">
        <div className="flex h-full flex-col justify-between p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Smart transport operations</p>
            <h2 className="mt-5 max-w-xl text-4xl font-semibold tracking-normal">
              Dispatch, maintenance, compliance, and cost visibility in one command center.
            </h2>
          </div>
          <div className="grid gap-4">
            {[
              ["Real-time dispatch safety", "Vehicles and drivers are rechecked inside server transactions before status changes."],
              ["Financial clarity", "Operational cost, fuel efficiency, and ROI are calculated from database records."],
              ["Audit-ready workflows", "Trips, maintenance, fuel, and expenses emit activity logs and notifications."]
            ].map(([title, description]) => (
              <div key={title} className="rounded-lg border bg-background/70 p-5">
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
