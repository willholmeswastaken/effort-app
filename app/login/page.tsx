"use client";

import { signIn } from "@/lib/auth-client";
import { Github } from "lucide-react";

export default function LoginPage() {
  const handleGitHubLogin = async () => {
    await signIn.social({
      provider: "github",
      callbackURL: "/",
    });
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      {/* Logo / Brand */}
      <div className="mb-12 text-center">
        <div className="w-20 h-20 rounded-full bg-linear-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl font-bold">T</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Welcome to EffortApp</h1>
        <p className="text-[#8E8E93]">Sign in to track your workouts</p>
      </div>

      {/* Sign In Button */}
      <button
        onClick={handleGitHubLogin}
        className="w-full max-w-sm py-4 bg-[#1C1C1E] rounded-2xl flex items-center justify-center gap-3 text-[17px] font-semibold active:bg-[#2C2C2E] transition-colors"
      >
        <Github className="w-5 h-5" />
        Continue with GitHub
      </button>

      {/* Terms */}
      <p className="text-[13px] text-[#8E8E93] text-center mt-8 max-w-xs">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </main>
  );
}
