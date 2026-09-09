export default function LoginLoading() {
  return (
    <div className="min-h-screen bg-[#F8F6F3] flex items-center justify-center p-6" aria-busy="true" aria-label="Loading">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Brand */}
        <div className="flex justify-center">
          <div className="h-12 w-32 rounded-lg bg-[#EAE6DF] animate-pulse" />
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-[#EAE6DF] p-8 shadow-sm">
          <div className="space-y-6">
            {/* Title */}
            <div className="h-7 w-48 rounded bg-[#F1EEE8] animate-pulse mx-auto" />

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="h-12 rounded-lg bg-[#F1EEE8] animate-pulse" />
              <div className="h-12 rounded-lg bg-[#F1EEE8] animate-pulse" />
            </div>

            {/* Submit Button */}
            <div className="h-12 rounded-lg bg-[#EAE6DF] animate-pulse" />
          </div>
        </div>

        {/* Footer Links */}
        <div className="flex justify-center space-x-4">
          <div className="h-4 w-24 rounded bg-[#F1EEE8] animate-pulse" />
          <div className="h-4 w-24 rounded bg-[#F1EEE8] animate-pulse" />
        </div>
      </div>
    </div>
  );
}