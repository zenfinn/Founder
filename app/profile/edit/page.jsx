import { AppHeader } from "@/components/AppHeader";
import { AuthGuard } from "@/components/AuthGuard";
import { ProfileEditor } from "@/components/ProfileEditor";

export const metadata = {
  title: "Profil bearbeiten",
  description: "Founder Profil bearbeiten.",
};

export default function ProfileEditPage() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-50">
      <AppHeader active="/dashboard" />
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Profil bearbeiten</p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Social Links und Profil pflegen.
          </h1>
          <div className="mt-8">
            <ProfileEditor />
          </div>
        </div>
      </section>
      </main>
    </AuthGuard>
  );
}
