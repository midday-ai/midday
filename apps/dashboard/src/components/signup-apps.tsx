import { SignupAppsForm } from "./signup-apps-form";

export function SignupApps() {
  return (
    <div className="py-6 px-8 max-w-[900px] flex items-between">
      <div className="flex-1">
        <h2 className="mb-2">Sign up for apps</h2>
        <p className="text-sm text-[#B0B0B0]">
          We’re currently developing a companion app for iOS. Sign up <br />
          below if you want to be notified for the beta release.
        </p>

        <div className="mt-8">
          <SignupAppsForm />
        </div>
      </div>
    </div>
  );
}
