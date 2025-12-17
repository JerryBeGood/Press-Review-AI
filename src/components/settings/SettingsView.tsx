import { ChangePasswordForm } from "./ChangePasswordForm";
import { ChangeEmailForm } from "./ChangeEmailForm";
import { DeleteAccountSection } from "./DeleteAccountSection";

interface SettingsViewProps {
  userEmail: string;
}

/**
 * SettingsView component
 * Main settings page that combines all account management sections
 */
export function SettingsView({ userEmail }: SettingsViewProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold font-mono uppercase tracking-tight">ACCOUNT SETTINGS</h1>
        <p className="text-sm md:text-base font-mono mt-2 text-gray-600">
          Manage your account security and preferences
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-8">
        {/* Change Password Section */}
        <section>
          <ChangePasswordForm />
        </section>

        {/* Change Email Section */}
        <section>
          <ChangeEmailForm currentEmail={userEmail} />
        </section>

        {/* Danger Zone Section */}
        <section>
          <DeleteAccountSection />
        </section>
      </div>
    </div>
  );
}
