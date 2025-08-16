import React, { useState } from 'react';
import { ExcelRow, BestContact, AltContact, DataSource } from '../types'; 
import { LinkIcon, ChevronDownIcon, ChevronUpIcon, PhoneIcon, InformationCircleIcon, MapPinIcon, UserIcon, WifiIcon, ClipboardDocumentListIcon, ShieldCheckIcon, EnvelopeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid'; 

interface ProcessedPropertyCardProps {
  item: ExcelRow; 
}

const ConfidenceBadge: React.FC<{ confidence: BestContact['confidence'] }> = ({ confidence }) => {
    const confidenceStyles = {
        High: { text: 'High', color: 'text-green-300', bg: 'bg-green-500/20', ring: 'ring-green-500/30' },
        Medium: { text: 'Medium', color: 'text-yellow-300', bg: 'bg-yellow-500/20', ring: 'ring-yellow-500/30' },
        Low: { text: 'Low', color: 'text-red-300', bg: 'bg-red-500/20', ring: 'ring-red-500/30' },
        null: { text: 'N/A', color: 'text-slate-400', bg: 'bg-slate-500/20', ring: 'ring-slate-500/30' },
    };
    const style = confidenceStyles[confidence || 'null'];
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.color} ring-1 ring-inset ${style.ring}`}>
            <ShieldCheckIcon className="w-3.5 h-3.5 mr-1.5" />
            {style.text} Confidence
        </span>
    );
};

const CollapsibleSection: React.FC<React.PropsWithChildren<{ title: string; count: number; icon: React.ReactElement<any> }>> = ({ title, count, icon, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    if (count === 0) return null;

    return (
        <div className="border-t border-slate-700/50 pt-3 mt-3">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between text-left text-sm font-semibold text-slate-300 hover:text-sky-300 transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500 rounded-md p-1.5"
                aria-expanded={isOpen}
            >
                <span className="flex items-center">
                    {React.cloneElement(icon, { className: "w-4 h-4 mr-2" })}
                    {title} ({count})
                </span>
                {isOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
            </button>
            {isOpen && <div className="mt-2 pl-2 space-y-2">{children}</div>}
        </div>
    );
};

const ProcessedPropertyCard: React.FC<ProcessedPropertyCardProps> = ({ item }) => {
  const originalFullAddress = [item.address, item.city, item.state, item.zipCode].filter(Boolean).join(', ');
  const subjectDisplay = item.subject || originalFullAddress || "N/A";

  const altContacts: AltContact[] = item.alt_contacts_json ? JSON.parse(item.alt_contacts_json) : [];
  const sources: DataSource[] = item.sources_json ? JSON.parse(item.sources_json) : [];
  const searchLog: string[] = item.search_log_text ? item.search_log_text.split('; ') : [];

  const isEffectivelyEmpty = item.ai_status !== 'success';

  if (isEffectivelyEmpty) { 
    return (
        <div className="frosted-glass-dark rounded-[1.5rem] p-5 interactive-glass-sheet h-full flex flex-col justify-between min-h-[250px] overflow-hidden">
            <div>
                 <h3 className="text-base font-semibold text-slate-300 mb-2 truncate flex items-center" title={subjectDisplay}>
                    <MapPinIcon className="w-5 h-5 inline-block mr-2 text-slate-400"/>{subjectDisplay}
                </h3>
                 <div className="my-4 p-4 bg-slate-800/40 rounded-xl ring-1 ring-slate-700/50 text-center">
                    <InformationCircleIcon className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-300">
                        {item.ai_message || "No confident match found"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        {item.ai_status === 'error' ? 'An error occurred during search.' : 'Zuno could not confirm contact info.'}
                    </p>
                </div>
            </div>
            <div className="mt-auto pt-2.5 border-t border-slate-700/50">
                <p className="text-xs text-slate-500 text-center">Orig. Property ID: {item.id}</p>
            </div>
        </div>
    );
  }

  return (
    <div className="frosted-glass-dark rounded-[1.5rem] p-5 interactive-glass-sheet h-full flex flex-col justify-between min-h-[250px] overflow-hidden">
      <div className="flex-grow overflow-y-auto custom-scrollbar -mr-3 pr-3">
        <h3 className="text-lg font-semibold text-sky-400 mb-2 truncate flex items-center" title={subjectDisplay}>
          <MapPinIcon className="w-5 h-5 inline-block mr-2 text-sky-500"/>
          {subjectDisplay}
        </h3>
        
        {/* Best Contact */}
        <div className="p-4 bg-slate-800/50 rounded-xl ring-1 ring-slate-700/60 mb-4">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-base font-semibold text-slate-200">Best Contact Found</h4>
                <ConfidenceBadge confidence={item.confidence as BestContact['confidence']} />
            </div>
            <div className="space-y-2 text-sm">
                <div className="flex items-center">
                    <PhoneIcon className="w-4 h-4 mr-3 text-slate-400 flex-shrink-0" />
                    {item.best_phone ? (
                        <a href={`tel:${item.best_phone}`} className="text-sky-300 hover:underline">{item.best_phone}</a>
                    ) : (<span className="text-slate-500 italic">Not found</span>)}
                </div>
                 <div className="flex items-center">
                    <EnvelopeIcon className="w-4 h-4 mr-3 text-slate-400 flex-shrink-0" />
                    {item.best_email ? (
                        <a href={`mailto:${item.best_email}`} className="text-sky-300 hover:underline break-all">{item.best_email}</a>
                    ) : (<span className="text-slate-500 italic">Not found</span>)}
                </div>
            </div>
        </div>

        {/* Alternate Contacts */}
        <CollapsibleSection title="Alternate Contacts" count={altContacts.length} icon={<UserIcon />}>
            <ul className="space-y-2.5">
                {altContacts.map((contact, i) => (
                    <li key={i} className="p-2.5 bg-slate-700/40 rounded-lg text-xs">
                        {contact.phone && <p className="flex items-center"><PhoneIcon className="w-3 h-3 inline mr-1.5"/>{contact.phone}</p>}
                        {contact.email && <p className="flex items-center"><EnvelopeIcon className="w-3 h-3 inline mr-1.5"/>{contact.email}</p>}
                        <p className="text-slate-400 mt-1 italic">Note: {contact.note}</p>
                    </li>
                ))}
            </ul>
        </CollapsibleSection>
        
        {/* Sources */}
        <CollapsibleSection title="Data Sources" count={sources.length} icon={<ClipboardDocumentListIcon />}>
             <ul className="space-y-2.5">
                {sources.map((source, i) => (
                    <li key={i} className="p-2.5 bg-slate-700/40 rounded-lg text-xs">
                        <p className="font-semibold text-slate-200">{source.label}</p>
                        <p className="text-slate-300">Data Point: {source.data_point}</p>
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline break-all block mt-1">
                            <LinkIcon className="w-3 h-3 inline mr-1"/>
                            {source.url}
                        </a>
                    </li>
                ))}
            </ul>
        </CollapsibleSection>

        {/* Search Log */}
        <CollapsibleSection title="AI Search Log" count={searchLog.length} icon={<MagnifyingGlassIcon />}>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-400">
                {searchLog.map((log, i) => <li key={i}>"{log}"</li>)}
            </ul>
        </CollapsibleSection>

      </div>
      <div className="mt-auto pt-2.5 border-t border-slate-700/50 -ml-5 -mr-2 px-5">
        <p className="text-xs text-slate-500 text-center">Generated: {item.generated_at ? new Date(item.generated_at).toLocaleString() : 'N/A'}</p>
      </div>
    </div>
  );
};

export default ProcessedPropertyCard;