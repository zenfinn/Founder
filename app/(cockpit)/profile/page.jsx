import { AuthGuard } from "@/components/AuthGuard";
import { CockpitPage, CockpitPanel } from "@/components/cockpit/CockpitPage";
import { ProfileEditor } from "@/components/ProfileEditor";

export default function ProfilePage() {
  return (
    <AuthGuard>
      <CockpitPage
        eyebrow="Profil"
        title="Dein Founder Profil"
        description="Pflege Avatar, Bio, Unternehmensdaten und öffentliche Profilinformationen."
      >
        <CockpitPanel>
          <ProfileEditor />
        </CockpitPanel>
      </CockpitPage>
    </AuthGuard>
  );
}
