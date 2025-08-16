
import React from 'react';
import { UserProfile } from '../types'; 

interface ProfilePageProps {
  userProfile: UserProfile; 
}

const DetailItem: React.FC<{label: string, value: string | string[] | undefined | null, isList?: boolean}> = 
  ({ label, value, isList = false }) => {
  
  if (isList && Array.isArray(value)) {
    return (
      <div>
        <p className="block text-sm font-semibold text-slate-400 mb-1.5">{label}</p>
        {value.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {value.map((item, index) => (
              <span key={index} className="text-xs bg-sky-700/80 text-sky-100 px-2.5 py-1 rounded-full">
                {item}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">Not specified</p>
        )}
      </div>
    );
  }
  
  const displayValue = value ? String(value) : null;
  if (!displayValue) {
    return (
      <div>
        <p className="block text-sm font-semibold text-slate-400 mb-1">{label}</p>
        <p className="text-slate-200 text-sm italic">Not specified</p>
      </div>
    );
  }

  const isLink = displayValue.startsWith('http') || displayValue.startsWith('linkedin');
  const linkHref = displayValue.startsWith('http') ? displayValue : `https://${displayValue}`;

  return (
    <div>
      <p className="block text-sm font-semibold text-slate-400 mb-1">{label}</p>
      {isLink ? (
        <a href={linkHref} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 hover:underline text-sm break-words">
          {displayValue}
        </a>
      ) : (
        <p className="text-slate-200 text-sm break-words">{displayValue}</p>
      )}
    </div>
  );
};


const ProfilePage = ({ userProfile }: ProfilePageProps): JSX.Element => {
  const defaultAvatar = "https://source.unsplash.com/random/128x128/?profile,person,abstract";

  if (!userProfile) { 
     return <div className="flex-grow p-6 sm:p-10 text-slate-200 flex items-center justify-center">User profile not available.</div>;
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
        <div className="p-6 sm:p-10">
          <header className="mb-8 flex justify-between items-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-sky-400">Your Profile</h1>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="frosted-glass-dark p-6 rounded-[2rem] text-center">
                <img 
                  src={userProfile.avatarUrl || defaultAvatar} 
                  alt={`${userProfile.name || 'User'}'s avatar`}
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full mx-auto mb-4 border-4 border-sky-500/70 object-cover shadow-lg" 
                />
                <h2 className="text-2xl font-bold text-sky-300">{userProfile.name || "User Name"}</h2>
                <p className="text-sm text-slate-400">{userProfile.title || "User Title"}</p>
              </div>
               <div className="frosted-glass-dark p-6 rounded-[2rem]">
                  <h3 className="text-xl font-semibold text-sky-400 mb-4">Contact Details</h3>
                  <div className="space-y-4">
                      <DetailItem label="Email" value={userProfile.contactEmail} />
                      <DetailItem label="Phone" value={userProfile.contactPhone} />
                      <DetailItem label="LinkedIn Profile" value={userProfile.linkedInProfile} />
                  </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="frosted-glass-dark p-6 rounded-[2rem]">
                  <h3 className="text-xl font-semibold text-sky-400 mb-4">Basic Information</h3>
                  <div className="space-y-4">
                      <DetailItem label="Full Name" value={userProfile.name}/>
                      <DetailItem label="Title / Role" value={userProfile.title} />
                      <DetailItem label="Bio" value={userProfile.bio} />
                  </div>
              </div>
              
              <div className="frosted-glass-dark p-6 rounded-[2rem]">
                <h3 className="text-xl font-semibold text-sky-400 mb-4">Professional Focus</h3>
                 <div className="space-y-4">
                    <DetailItem label="Areas of Expertise" value={userProfile.expertise || []} isList={true} />
                    <DetailItem label="Interests" value={userProfile.interests || []} isList={true} />
                  </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default ProfilePage;