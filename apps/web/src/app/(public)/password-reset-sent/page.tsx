export default function PasswordResetSentPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow border">
        <h1 className="text-2xl font-semibold mb-4">
          Check your email
        </h1>

        <p className="text-gray-600 mb-6">
          A password reset link has been sent to your email address.
          You have been signed out of all devices. Please check your
          inbox and follow the link to set your new password.
        </p>

        <a
          href="/login"
          className="block w-full bg-black text-white py-2 rounded-md
            hover:bg-gray-800 text-center"
        >
          Back to login
        </a>
      </div>
    </div>
  );
}
