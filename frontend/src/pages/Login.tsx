import React, { useState } from "react";
import { ShieldCheck, Lock, Mail, ArrowRight } from "lucide-react";

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("sarah.chen@trials-intel.org");
  const [password, setPassword] = useState("••••••••••••");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            AMW
          </div>
        </div>
        <h2 className="text-center text-xl font-bold tracking-wider uppercase text-white">
          ATLAS MONITOR WATCH
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Explainable Clinical Trial Intelligence & Continuous Monitoring
        </p>
        <p className="mt-2 text-center text-[11px] text-slate-500 italic max-w-xs mx-auto">
          "Understand the data. Review the risk. Watch what changes. Explain every decision."
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/80 backdrop-blur-md py-8 px-6 shadow-2xl rounded-xl sm:px-10 border border-slate-700">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Investigator / Reviewer Email
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-slate-600 rounded-lg text-xs bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-slate-600 rounded-lg text-xs bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Verified Session
              </div>
              <p>Active Study: <strong>ABC-101 (Phase II)</strong></p>
              <p>Role: <strong>Medical Monitor (Sovereign Human Gate)</strong></p>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none transition-colors"
            >
              Sign In to Study Dashboard <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-[11px] text-slate-500">
          Compliant with 21 CFR Part 11 Electronic Records & GCP Regulations.
        </div>
      </div>
    </div>
  );
};
