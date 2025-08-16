import React from 'react';
import { AppView, UserProfile } from '../types'; 
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  UserCircleIcon,
  Cog6ToothIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  BriefcaseIcon
} from '@heroicons/react/24/solid';


interface DashboardProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  userProfile: UserProfile | null;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

const iconMap: Record<AppView, React.ReactElement<React.SVGProps<SVGSVGElement>>> = {
  home: <HomeIcon className="w-6 h-6" />,
  new_search: <MagnifyingGlassIcon className="w-6 h-6" />,
  workspaces: <BriefcaseIcon className="w-6 h-6" />,
  profile: <UserCircleIcon className="w-6 h-6" />,
  settings: <Cog6ToothIcon className="w-6 h-6" />,
};

const viewTooltips: Record<AppView, string> = {
  home: 'Home Dashboard',
  new_search: 'New Search',
  workspaces: 'Workspaces',
  profile: 'Your Profile',
  settings: 'Application Settings',
};

const Dashboard: React.FC<DashboardProps> = ({ activeView, setActiveView, userProfile, isExpanded, setIsExpanded }) => {
  return (
    <nav className={`frosted-glass-dark border-r border-slate-700/60 shadow-2xl rounded-r-[1.75rem] ml-2 my-2 
                     flex flex-col items-center transition-all duration-300 ease-in-out
                     fixed top-0 left-0 h-[calc(100%-1rem)]
                     ${isExpanded ? 'w-64 p-4' : 'w-20 p-3'}`}>
      {/* Zuno Logo */}
      <div className={`flex items-center w-full mb-6 ${isExpanded ? 'justify-start pl-1' : 'justify-center'}`} title="Zuno vBeta">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} className="w-9 h-9 flex-shrink-0">
          <defs>
            <linearGradient id="zunoLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor: '#38bdf8', stopOpacity: 1}} /> {/* sky-500 */}
              <stop offset="50%" style={{stopColor: '#8b5cf6', stopOpacity: 1}} /> {/* violet-500 */}
              <stop offset="100%" style={{stopColor: '#ec4899', stopOpacity: 1}} /> {/* pink-500 */}
            </linearGradient>
          </defs>
          <path strokeLinecap="round" strokeLinejoin="round" stroke="url(#zunoLogoGradient)" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} stroke="rgba(255,255,255,0.9)" d="M8.25 8.25h7.5L8.25 15.75h7.5" />
        </svg>
        {isExpanded && <span className="ml-3 text-2xl font-semibold text-slate-100 truncate">Zuno</span>}
      </div>

      <div className={`flex-grow w-full space-y-2.5 ${isExpanded ? 'mt-2' : 'mt-1'}`}>
        {(Object.keys(iconMap) as AppView[]).map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            title={isExpanded ? viewTooltips[view] : `${viewTooltips[view]}`}
            className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 ease-in-out group focus:outline-none focus:ring-2 focus:ring-sky-400/80
                        ${isExpanded ? 'justify-start' : 'justify-center'}
                        ${activeView === view 
                          ? 'bg-sky-500 text-white shadow-lg transform scale-105' 
                          : 'text-slate-400 hover:bg-slate-700/80 hover:text-sky-300 hover:shadow-md hover:scale-[1.03]'
                        }`}
            aria-current={activeView === view ? 'page' : undefined}
            aria-label={viewTooltips[view]}
          >
            {React.cloneElement(iconMap[view], { className: `w-6 h-6 flex-shrink-0 ${activeView === view ? 'text-white' : 'text-slate-400 group-hover:text-sky-300 transition-colors'}` })}
            {isExpanded && <span className={`ml-4 text-sm font-medium truncate ${activeView === view ? 'text-white' : 'text-slate-200 group-hover:text-slate-50 transition-colors'}`}>{viewTooltips[view]}</span>}
          </button>
        ))}
      </div>
      
      {userProfile && (
        <button
            onClick={() => setActiveView('profile')}
            title={isExpanded ? `View ${userProfile.name}'s Profile` : "Your Profile"}
            className={`w-full flex items-center mt-auto mb-2 p-2 rounded-xl transition-all duration-200 ease-in-out group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500
                        ${isExpanded ? 'justify-start hover:bg-slate-700/60' : 'justify-center hover:bg-slate-700/80'}`}
        >
            <img 
            src={userProfile.avatarUrl || "https://source.unsplash.com/random/128x128/?profile"} 
            alt="User Avatar" 
            className="w-9 h-9 rounded-full object-cover border-2 border-transparent group-hover:border-sky-400 transition-colors flex-shrink-0"
            />
            {isExpanded && <span className="ml-3 text-sm text-slate-200 truncate group-hover:text-slate-50 transition-colors">{userProfile.name}</span>}
        </button>
      )}
      
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
        className="w-full flex items-center p-3 mt-2 text-slate-400 hover:bg-slate-700/70 hover:text-sky-300 rounded-xl transition-colors duration-200 ease-in-out group focus:outline-none focus:ring-2 focus:ring-sky-500/80"
        aria-label={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        {isExpanded ? (
          <>
            <ChevronDoubleLeftIcon className="w-6 h-6 flex-shrink-0 text-slate-400 group-hover:text-sky-300 transition-colors" />
            <span className="ml-4 text-sm font-medium text-slate-200 group-hover:text-slate-50 transition-colors">Collapse</span>
          </>
        ) : (
          <ChevronDoubleRightIcon className="w-6 h-6 mx-auto text-slate-400 group-hover:text-sky-300 transition-colors" />
        )}
      </button>

      <div className={`mt-2 text-xs text-slate-500 hover:text-slate-400 transition-colors self-center ${isExpanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`} title="Zuno Version Beta">
        Zuno <span className="font-semibold text-sky-500">vBeta</span>
      </div>
    </nav>
  );
};

export default Dashboard;