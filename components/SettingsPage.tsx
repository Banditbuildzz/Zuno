
import React, { useState } from 'react';
import { ThemePreference } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface SettingsPageProps {
  currentTheme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
}

const SettingsPage = ({ currentTheme, onThemeChange }: SettingsPageProps): JSX.Element => {
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleThemeChange = (newTheme: ThemePreference) => {
    if (newTheme === currentTheme) return;
    setIsLoading(true);
    setFeedbackMessage(null);
    
    // Simulate a brief delay for UX, then update the global state
    setTimeout(() => {
        onThemeChange(newTheme);
        setFeedbackMessage({ type: 'success', text: 'Theme preference updated!' });
        setIsLoading(false);
    }, 300);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-6 sm:p-10">
        <header className="mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-sky-400">Settings</h1>
          <p className="mt-2 text-slate-400">Customize your Zuno application experience.</p>
        </header>

        {feedbackMessage && (
          <div className={`p-3.5 rounded-xl mb-6 text-sm text-center ${feedbackMessage.type === 'success' ? 'bg-green-600/80 text-green-100' : 'bg-red-600/80 text-red-100'}`} role="alert">
            {feedbackMessage.text}
          </div>
        )}

        <div className="space-y-8">
          {/* Appearance Settings */}
          <section className="frosted-glass-dark p-6 rounded-[2rem]">
            <h2 className="text-xl font-semibold text-sky-300 mb-5">Appearance</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Theme Preference</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {(['dark', 'light'] as ThemePreference[]).map(th => (
                    <button
                      key={th}
                      onClick={() => handleThemeChange(th)}
                      disabled={isLoading}
                      className={`w-full sm:w-auto flex-1 sm:flex-initial py-2.5 px-5 rounded-lg text-sm font-medium transition-all duration-200 border-2
                                  ${currentTheme === th 
                                    ? 'bg-sky-500 border-sky-500 text-white shadow-md' 
                                    : 'bg-slate-700/70 border-slate-600/80 hover:bg-slate-600/70 hover:border-slate-500 text-slate-200 disabled:opacity-50'
                                  }`}
                    >
                      {th.charAt(0).toUpperCase() + th.slice(1)} Mode
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {isLoading && !feedbackMessage && <div className="mt-3 flex items-center text-sm text-yellow-400"><LoadingSpinner size="w-4 h-4 mr-2" />Updating theme...</div>}
          </section>

          {/* API Key Security Information */}
          <section className="frosted-glass-dark p-6 rounded-[2rem]">
            <h2 className="text-xl font-semibold text-amber-400 mb-4">API Key & Security</h2>
            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              <p>
                <strong className="text-amber-300">Important:</strong> Zuno utilizes the Gemini API for its advanced AI features.
                Your API Key is a sensitive credential.
              </p>
              <p>
                In the current development version of Zuno, the API key is configured for client-side use.
                <strong className="text-red-400"> This is NOT secure for production or public deployment.</strong>
              </p>
              <p>
                For a publicly accessible application, you <strong className="text-amber-300">MUST</strong> handle Gemini API calls through a secure backend proxy (e.g., a Node.js server or similar). Your API key should <strong className="text-red-400">NEVER</strong> be directly exposed in frontend code.
              </p>
              <p>
                The API key is assumed to be pre-configured via the <code className="text-xs bg-slate-700 p-1 rounded">process.env.API_KEY</code> environment variable for this application.
                <strong className="text-amber-300"> Zuno does not provide a UI to enter or manage the API key directly in the browser to prevent accidental exposure.</strong>
              </p>
               <p className="text-xs text-slate-400">
                  If AI features are not working, ensure your API_KEY environment variable is correctly set up in your development environment.
              </p>
            </div>
          </section>
        </div>
        
        <footer className="mt-12 py-6 border-t border-slate-700/50 text-center text-slate-500 text-sm">
          <p>Zuno Settings vBeta</p>
        </footer>
      </div>
    </div>
  );
};

export default SettingsPage;
