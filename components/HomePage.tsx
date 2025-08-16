import React, { useState, useEffect } from 'react';
import { UserProfile, NearMeProperty, AppView } from '../types';
import { 
  SunIcon, 
  MoonIcon,
  MagnifyingGlassPlusIcon,
  UserCircleIcon,
  EyeIcon, 
  ServerStackIcon, 
  SparklesIcon, 
  HeartIcon, 
  WrenchScrewdriverIcon, 
  ArrowRightIcon,
  MapPinIcon,
} from '@heroicons/react/24/solid'; 
import LoadingSpinner from './LoadingSpinner';
import NearMePropertyCard from './NearMePropertyCard';
import { findPropertiesNearLocation } from '../services/geminiService';

interface HomePageProps {
  userProfile: UserProfile | null;
  setActiveView?: (view: AppView) => void; 
  isLoadingGlobal: boolean; 
}

const HomePage: React.FC<HomePageProps> = ({ 
    userProfile, 
    setActiveView,
    isLoadingGlobal
}) => {
  const [nearMeProperties, setNearMeProperties] = useState<NearMeProperty[]>([]);
  const [isFetchingNearMe, setIsFetchingNearMe] = useState(true);
  const [nearMeError, setNearMeError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNearMe = () => {
      if (!navigator.geolocation) {
        setNearMeError("Geolocation is not supported by your browser.");
        setIsFetchingNearMe(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const properties = await findPropertiesNearLocation(position.coords.latitude, position.coords.longitude);
            setNearMeProperties(properties);
            if (properties.length === 0) {
              setNearMeError("AI couldn't find any notable properties nearby at this moment.");
            }
          } catch (error) {
            console.error("Error fetching near me properties:", error);
            setNearMeError("An error occurred while fetching nearby properties.");
          } finally {
            setIsFetchingNearMe(false);
          }
        },
        () => {
          setNearMeError("Location access was denied. Please enable it in your browser settings to use this feature.");
          setIsFetchingNearMe(false);
        }
      );
    };

    fetchNearMe();
  }, []);


  const getGreetingParts = () => {
    const hour = new Date().getHours();
    if (hour < 5 || hour >= 21) return { text: "Good Evening", icon: <MoonIcon className="w-8 h-8 sm:w-10 sm:h-10 inline-block mr-3 text-indigo-400" /> };
    if (hour < 12) return { text: "Good Morning", icon: <SunIcon className="w-8 h-8 sm:w-10 sm:h-10 inline-block mr-3 text-yellow-400" /> };
    if (hour < 18) return { text: "Good Afternoon", icon: <SunIcon className="w-8 h-8 sm:w-10 sm:h-10 inline-block mr-3 text-orange-400" /> };
    return { text: "Good Evening", icon: <MoonIcon className="w-8 h-8 sm:w-10 sm:h-10 inline-block mr-3 text-indigo-400" /> }; // Fallback for 18-21
  };

  if (!userProfile) {
    return ( 
      <div className="flex-grow p-6 sm:p-10 bg-slate-900 text-slate-200 flex items-center justify-center">
        <p>Loading user profile...</p>
      </div>
    );
  }
  
  const greetingParts = getGreetingParts();
  const firstName = userProfile.name.split(' ')[0] || 'Explorer';
  
  const quickActions = [
    { name: "New Property Search", icon: <MagnifyingGlassPlusIcon className="w-8 h-8 text-sky-400 group-hover:text-sky-300 transition-colors" />, description: "Upload Excel or search properties manually.", targetView: "new_search", color: "sky" },
    { name: "Manage Profile", icon: <UserCircleIcon className="w-8 h-8 text-green-400 group-hover:text-green-300 transition-colors" />, description: "Update your details and preferences.", targetView: "profile", color: "green" },
    { name: "Adjust Settings", icon: <WrenchScrewdriverIcon className="w-8 h-8 text-teal-400 group-hover:text-teal-300 transition-colors" />, description: "Customize your Zuno experience.", targetView: "settings", color: "teal" },
  ];

  const renderProfilePrompt = (area: string) => (
    <p className="text-sm text-slate-400">
      No {area} specified.
      {setActiveView && (
        <button 
          onClick={() => setActiveView('profile')}
          className="text-sky-400 hover:text-sky-300 underline font-medium ml-1"
        >
          Update your profile
        </button>
      )} to add them.
    </p>
  );

  return (
    <div className="flex-grow p-6 sm:p-10 bg-slate-900 text-slate-200 overflow-y-auto custom-scrollbar">
      <header className="mb-10 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-100 flex items-center">
          {greetingParts.icon}
          <span>{greetingParts.text}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-rose-400 to-lime-400">{firstName}</span>!</span>
        </h1>
        <p className="mt-3 text-lg text-slate-300 max-w-2xl">Welcome back to Zuno. Let's find your next opportunity.</p>
      </header>

      {/* Quick Actions */}
      <section className="mb-10 sm:mb-12">
        <h2 className="text-2xl font-semibold text-slate-100 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {quickActions.map(action => (
            <button
              key={action.name}
              onClick={() => setActiveView && setActiveView(action.targetView as any)}
              disabled={!setActiveView || isLoadingGlobal}
              className={`frosted-glass-dark p-6 rounded-[1.5rem] text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500/80 transition-all duration-300 group interactive-glass-sheet hover:shadow-sky-500/10 flex items-start space-x-4 disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              <div className={`p-3 rounded-full bg-sky-500/20`}>
                {action.icon}
              </div>
              <div>
                <h3 className={`text-xl font-semibold text-slate-100 group-hover:text-sky-300 mb-1 transition-colors`}>{action.name}</h3>
                <p className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors">{action.description}</p>
              </div>
              {setActiveView && <ArrowRightIcon className="w-5 h-5 text-slate-400 ml-auto self-center group-hover:translate-x-1 transition-transform" />}
            </button>
          ))}
        </div>
      </section>

       {/* Discover Nearby Opportunities */}
      <section className="mb-10 sm:mb-12">
        <h2 className="text-2xl font-semibold text-slate-100 mb-6 flex items-center">
            <MapPinIcon className="w-7 h-7 mr-3 text-indigo-400" />
            Discover Nearby Opportunities
        </h2>
        {isFetchingNearMe && (
            <div className="flex items-center justify-center p-8 frosted-glass-dark rounded-[1.5rem]">
                <LoadingSpinner size="w-8 h-8" color="text-indigo-400" />
                <p className="ml-4 text-slate-300">Fetching your location and searching for properties...</p>
            </div>
        )}
        {nearMeError && !isFetchingNearMe && (
             <div className="p-6 frosted-glass-dark rounded-[1.5rem] text-center">
                <p className="text-yellow-400">{nearMeError}</p>
            </div>
        )}
        {!isFetchingNearMe && !nearMeError && nearMeProperties.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {nearMeProperties.map(prop => <NearMePropertyCard key={prop.id} property={prop} />)}
            </div>
        )}
      </section>
      
      {/* Profile Snapshot Section */}
      <section className="mb-10 sm:mb-12">
        <h2 className="text-2xl font-semibold text-slate-100 mb-6">Your Snapshot</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="frosted-glass-dark p-6 rounded-[1.5rem] h-full flex flex-col">
            <h3 className="text-lg font-semibold text-sky-300 mb-3 flex items-center">
              <SparklesIcon className="w-5 h-5 mr-2 text-sky-400"/> Expertise Areas
            </h3>
            {userProfile.expertise && userProfile.expertise.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userProfile.expertise.slice(0, 6).map(exp => (
                  <span key={exp} className="text-xs bg-sky-700/80 text-sky-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                    {exp}
                  </span>
                ))}
                {userProfile.expertise.length > 6 && <span className="text-xs text-slate-400 self-end">...and more</span>}
              </div>
            ) : ( renderProfilePrompt("expertise areas") )}
          </div>
          
          <div className="frosted-glass-dark p-6 rounded-[1.5rem] h-full flex flex-col">
            <h3 className="text-lg font-semibold text-indigo-400 mb-3 flex items-center">
              <HeartIcon className="w-5 h-5 mr-2 text-indigo-500"/> Interests
            </h3>
            {userProfile.interests && userProfile.interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userProfile.interests.slice(0,6).map(interest => (
                  <span key={interest} className="text-xs bg-indigo-600/70 text-indigo-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                    {interest}
                  </span>
                ))}
                {userProfile.interests.length > 6 && <span className="text-xs text-slate-400 self-end">...and more</span>}
              </div>
            ) : ( renderProfilePrompt("interests") )}
          </div>

          <div className="frosted-glass-dark p-6 rounded-[1.5rem] h-full flex flex-col md:col-span-2 lg:col-span-1">
            <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center">
              <ServerStackIcon className="w-5 h-5 mr-2 text-green-500"/> Recent Platform Activity (Mock)
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center"><EyeIcon className="w-4 h-4 mr-2 text-slate-400"/> Viewed 5 properties (simulated)</li>
              <li className="flex items-center"><ServerStackIcon className="w-4 h-4 mr-2 text-slate-400"/> 1 Batch Processed (simulated)</li>
              <li className="flex items-center"><UserCircleIcon className="w-4 h-4 mr-2 text-slate-400"/> 3 Manual Searches (simulated)</li>
            </ul>
          </div>
        </div>
      </section>
      
      <footer className="mt-12 py-6 border-t border-slate-700/50 text-center text-slate-500 text-sm">
        <p>Tip: Complete your profile in <button onClick={() => setActiveView && setActiveView('settings')} disabled={!setActiveView || isLoadingGlobal} className="text-sky-400 hover:text-sky-300 underline font-medium disabled:opacity-70">Settings</button> or <button onClick={() => setActiveView && setActiveView('profile')} disabled={!setActiveView || isLoadingGlobal} className="text-sky-400 hover:text-sky-300 underline font-medium disabled:opacity-70">Profile</button> for a more tailored Zuno experience.</p>
      </footer>
    </div>
  );
};

export default HomePage;