export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Reset Password
        </h1>
        <p className="text-sm text-neutral-600 mb-6">
          Password reset functionality coming soon.
        </p>
        <a 
          href="/login"
          className="inline-block text-sm text-[#ff6b35] hover:text-[#ff8555]"
        >
           Back to Login
        </a>
      </div>
    </div>
  );
}
