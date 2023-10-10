import { SignupAppsForm } from "./signup-apps-form";

export function SignupApps() {
  return (
    <div className="py-6 px-8 max-w-[900px] flex items-between opacity-50">
      <div className="flex-1">
        <div className="flex items-start space-x-2">
          <h2 className="mb-2">Sign up for apps</h2>
          <button
            disabled
            type="button"
            className="relative rounded-lg overflow-hidden p-[1px]"
            style={{
              background:
                "linear-gradient(-45deg, rgba(235,248,255,.18) 0%, #848f9c 50%, rgba(235,248,255,.18) 100%)",
            }}
          >
            <span className="flex items-center gap-4 py-1 px-2 rounded-[7px] bg-background text-xs h-full font-normal">
              Comming soon
            </span>
          </button>
        </div>
        <p className="text-sm text-[#B0B0B0]">
          We’re currently developing our iOS and Android apps. Sign up <br />
          below if you want to be notified for the beta release.
        </p>

        <div className="mt-8">
          <SignupAppsForm />
        </div>
      </div>
    </div>
  );
}
