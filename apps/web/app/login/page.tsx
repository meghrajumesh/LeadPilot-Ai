import { LoginForm } from "./login-form";
import { Bot, Check } from "lucide-react";

const features = [
  "Secure Supabase authentication",
  "Workspace-based project ownership",
  "Ready for chat, leads, and reporting",
];

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="flex w-full max-w-[1000px] flex-col overflow-hidden rounded-2xl shadow-sm md:min-h-[560px] md:flex-row">
        {/* LEFT — branding */}
        <div className="flex flex-1 flex-col justify-center bg-slate-900 p-12 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
              <Bot className="h-6 w-6 text-white" />
            </span>
            <span className="text-xl font-bold">LeadPilot AI</span>
          </div>
          <h2 className="mb-7 mt-8 text-2xl font-bold leading-snug">
            Turn every website conversation into a trackable lead.
          </h2>
          <ul className="space-y-4">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20">
                  <Check className="h-3.5 w-3.5 text-indigo-300" />
                </span>
                <span className="text-base text-slate-300">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT — form */}
        <div className="flex flex-1 flex-col justify-center bg-white p-12">
          <LoginForm nextPath="/dashboard" />
        </div>
      </div>
    </main>
  );
}
