import { AuthGuard } from "@/components/AuthGuard";
import { CockpitPage, CockpitPanel } from "@/components/cockpit/CockpitPage";
import { ProfileEditor } from "@/components/ProfileEditor";
import { ReferralSettingsSection } from "@/components/ReferralSettingsSection";

export const metadata = {
  title: "Profil bearbeiten",
  description: "Founder Profil bearbeiten.",
};

export default function ProfileEditPage() {
  return (
    <AuthGuard>
      <CockpitPage eyebrow="Profil bearbeiten" title="Social Links und Profil pflegen.">
        <CockpitPanel>
          <ProfileEditor />
          <ReferralSettingsSection />
        </CockpitPanel>
      </CockpitPage>
    </AuthGuard>
  );
}
