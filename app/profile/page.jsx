import { AppHeader } from "@/components/AppHeader";
import { AuthGuard } from "@/components/AuthGuard";
import { ProfileEditor } from "@/components/ProfileEditor";

export default function ProfilePage() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-50">
      <AppHeader active="/dashboard" />
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-founder-600">Profil</p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Dein Founder Profil.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Pflege Avatar, Bio, Unternehmensdaten und öffentliche Profilinformationen.
          </p>
          <div className="mt-8">
            <ProfileEditor />
          </div>
        </div>
      </section>
      </main>
    </AuthGuard>
  );
}
