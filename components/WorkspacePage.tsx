import React, { useState, useMemo } from 'react';
import { Workspace, GroundingSource } from '../types';
import ProcessedPropertyCard from './ProcessedPropertyCard';
import { BriefcaseIcon, ChevronDownIcon, ChevronUpIcon, TrashIcon, LinkIcon } from '@heroicons/react/24/solid';

interface WorkspacePageProps {
  workspaces: Workspace[];
  setWorkspaces: React.Dispatch<React.SetStateAction<Workspace[]>>;
}

const WorkspaceItem: React.FC<{
    workspace: Workspace;
    isOpen: boolean;
    onToggle: () => void;
    onDelete: () => void;
}> = ({ workspace, isOpen, onToggle, onDelete }) => {
    
    const allSources = useMemo(() => {
        const sourcesMap = new Map<string, GroundingSource>();
        workspace.searches.forEach(search => {
            if (search.groundingSources) {
                search.groundingSources.forEach(source => {
                    if (source.uri && !sourcesMap.has(source.uri)) {
                        sourcesMap.set(source.uri, source);
                    }
                });
            }
        });
        return Array.from(sourcesMap.values());
    }, [workspace.searches]);

    return (
        <div className="frosted-glass-dark rounded-2xl overflow-hidden transition-all duration-300">
            <button 
                className="w-full flex items-center justify-between p-4 text-left"
                onClick={onToggle}
                aria-expanded={isOpen}
                aria-controls={`workspace-content-${workspace.id}`}
            >
                <div className="flex items-center min-w-0">
                    <BriefcaseIcon className="w-6 h-6 mr-4 text-sky-400 flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="text-lg font-semibold text-slate-100 truncate">{workspace.name}</p>
                        <p className="text-xs text-slate-400">
                            {workspace.searches.length} items | Saved on {new Date(workspace.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center ml-4">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-2 text-slate-400 hover:text-red-400 rounded-full hover:bg-slate-700/70 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                        title="Delete workspace"
                    >
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                    {isOpen ? <ChevronUpIcon className="w-6 h-6 text-slate-400 ml-2" /> : <ChevronDownIcon className="w-6 h-6 text-slate-400 ml-2" />}
                </div>
            </button>
            {isOpen && (
                <div id={`workspace-content-${workspace.id}`} className="p-4 border-t border-slate-700/50">
                    {allSources.length > 0 && (
                         <div className="mb-6 p-4 bg-slate-800/50 rounded-xl">
                            <h4 className="text-base font-semibold text-slate-300 mb-2">Web Sources Consulted for this Workspace</h4>
                             <ul className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1 pl-2 border-l-2 border-slate-700">
                                {allSources.map((source, index) => (
                                <li key={index} className="text-xs">
                                    <a
                                    href={source.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sky-400 hover:text-sky-300 hover:underline truncate block"
                                    title={source.title || source.uri}
                                    >
                                    <LinkIcon className="w-3 h-3 inline-block mr-1.5" />
                                    {source.title || source.uri}
                                    </a>
                                </li>
                                ))}
                            </ul>
                        </div>
                    )}
                   
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {workspace.searches.map(item => (
                            <ProcessedPropertyCard key={item.id} item={item} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


const WorkspacePage: React.FC<WorkspacePageProps> = ({ workspaces, setWorkspaces }) => {
    const [openWorkspaceId, setOpenWorkspaceId] = useState<string | null>(workspaces.length > 0 ? workspaces[0].id : null);

    const handleDeleteWorkspace = (idToDelete: string) => {
        if (window.confirm("Are you sure you want to permanently delete this workspace? This action cannot be undone.")) {
            setWorkspaces(prev => {
                const updated = prev.filter(ws => ws.id !== idToDelete);
                 try {
                    localStorage.setItem('zuno-workspaces', JSON.stringify(updated));
                } catch (error) {
                    console.error("Failed to update localStorage after delete", error);
                    alert("Error: Could not update saved workspaces.");
                }
                return updated;
            });
        }
    };

    const toggleWorkspace = (id: string) => {
        setOpenWorkspaceId(prevId => (prevId === id ? null : id));
    };

    return (
        <div className="h-full overflow-y-auto custom-scrollbar">
            <div className="p-6 sm:p-10">
                <header className="mb-8 sm:mb-10">
                    <h1 className="text-3xl sm:text-4xl font-bold text-sky-400 flex items-center">
                        <BriefcaseIcon className="w-8 h-8 mr-4"/>
                        Workspaces
                    </h1>
                    <p className="mt-2 text-slate-400">Review your saved search sessions.</p>
                </header>

                {workspaces.length === 0 ? (
                    <div className="text-center py-16 px-6 frosted-glass-dark rounded-2xl">
                        <BriefcaseIcon className="w-16 h-16 mx-auto text-slate-500 mb-4" />
                        <h2 className="text-2xl font-semibold text-slate-200">No Workspaces Yet</h2>
                        <p className="text-slate-400 mt-2 max-w-md mx-auto">
                            After running a search on the 'New Search' page, you can save the results to a workspace to find them here later.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {workspaces.map(ws => (
                            <WorkspaceItem 
                                key={ws.id}
                                workspace={ws}
                                isOpen={openWorkspaceId === ws.id}
                                onToggle={() => toggleWorkspace(ws.id)}
                                onDelete={() => handleDeleteWorkspace(ws.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkspacePage;