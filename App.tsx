

/* global XLSX */
import React, { useState, useCallback, ChangeEvent, DragEvent, FormEvent, useEffect, useRef } from 'react';
import { UserProfile, PropertyData, RawGeminiResponse, ExcelRow, DataEntryMode, ProcessingSummary, ThemePreference, AppView, Workspace, BestContact } from './types';

// Component Imports
import Dashboard from './components/Dashboard';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage'; 
import SettingsPage from './components/SettingsPage'; 
import SearchPageContent from './components/SearchPageContent';
import WorkspacePage from './components/WorkspacePage';

// Service Imports
import { getContactIntelligence } from './services/geminiService';

declare var XLSX: any;

const mockUserProfile: UserProfile = {
  id: 'localuser01',
  name: 'Property Pro',
  title: 'Real Estate Analyst',
  bio: 'Dedicated professional leveraging AI to uncover real estate opportunities. My focus is on data-driven analysis and market trends.',
  avatarUrl: 'https://source.unsplash.com/random/128x128/?profile,person',
  expertise: ['Commercial Real Estate', 'Market Analysis', 'PVA Data', 'Due Diligence'],
  interests: ['AI in Prop-Tech', 'Urban Development', 'Architectural Design'],
  contactEmail: 'demo@zuno.ai',
  contactPhone: '555-123-4567',
  linkedInProfile: 'linkedin.com/in/demoprofile',
  theme: 'dark'
};

const EXPECTED_HEADER_MAPPINGS: Record<keyof Omit<PropertyData, 'id' | 'city' | 'state' | 'zipCode'>, string[]> = {
  contactName: ["Owner - Contact", "Contact Name", "Owner Name", "Contact"],
  address: ["Address", "Property Address", "Property Street Address", "Property Full Address"],
  companyAddress: ["Company Address", "Company Full Address"],
  propertySize: ["Building Size (SF)", "Property Size (SF)", "Building Size", "Size (SF)"],
  lastSale: ["Last Sale", "Last Sale Price (Total) & Date", "Sale Info"]
};
const CITY_HEADER_VARIANTS = ["City", "Property City"];
const STATE_HEADER_VARIANTS = ["State", "Property State", "State/Province"];
const ZIPCODE_HEADER_VARIANTS = ["Zip Code", "Property Zip Code", "Postal Code", "Property Postal Code"];

const loadingPhrases = [
  "Brewing property insights...", "Consulting the AI council...", "Digging through digital archives...",
  "Uncovering contact details...", "Connecting the dots...", "Cross-referencing data points...",
  "Zuno's AI is on the case!", "Finalizing discoveries..."
];

const findHeaderValue = (row: any, headerVariants: string[]): string | undefined => {
  for (const variant of headerVariants) {
    const key = Object.keys(row).find(k => k.toLowerCase() === variant.toLowerCase());
    if (key && row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return String(row[key]);
    }
  }
  return undefined;
};

const parseExcelToPropertyData = (jsonData: any[]): PropertyData[] => {
  return jsonData.map((row: any, index: number): PropertyData => {
    const contactName = findHeaderValue(row, EXPECTED_HEADER_MAPPINGS.contactName) || `Unnamed Contact ${index + 1}`;
    const address = findHeaderValue(row, EXPECTED_HEADER_MAPPINGS.address) || 'N/A';
    const city = findHeaderValue(row, CITY_HEADER_VARIANTS);
    const state = findHeaderValue(row, STATE_HEADER_VARIANTS);
    const zipCode = findHeaderValue(row, ZIPCODE_HEADER_VARIANTS);
    const property: PropertyData = {
      id: String(index + 1),
      contactName,
      address,
      city,
      state,
      zipCode,
      companyAddress: findHeaderValue(row, EXPECTED_HEADER_MAPPINGS.companyAddress),
      propertySize: findHeaderValue(row, EXPECTED_HEADER_MAPPINGS.propertySize),
      lastSale: findHeaderValue(row, EXPECTED_HEADER_MAPPINGS.lastSale),
    };
    return property;
  }).filter(p => (p.address !== 'N/A') && p !== undefined);
};

const App: React.FC = () => {
  const [currentDashboardView, setCurrentDashboardView] = useState<AppView>('home');
  const [currentDataEntryMode, setCurrentDataEntryMode] = useState<DataEntryMode>('upload');

  const [parsedProperties, setParsedProperties] = useState<PropertyData[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);
  const [fileParseError, setFileParseError] = useState<string | null>(null);
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentProcessingProgress, setCurrentProcessingProgress] = useState(0);
  const [currentLoadingPhrase, setCurrentLoadingPhrase] = useState(loadingPhrases[0]);
  const loadingPhraseIntervalRef = useRef<number | null>(null);
  const processingTimerRef = useRef<number | null>(null);

  const [batchProcessingResults, setBatchProcessingResults] = useState<ExcelRow[] | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<ProcessingSummary | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  const [manualInputs, setManualInputs] = useState<Partial<PropertyData>>({ address: '' });
  const [manualSearchResult, setManualSearchResult] = useState<ExcelRow | null>(null);
  const [manualSearchError, setManualSearchError] = useState<string | null>(null);
  
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [theme, setTheme] = useState<ThemePreference>(() => (localStorage.getItem('zuno-theme') as ThemePreference) || 'dark');
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  
  const [isDeepResearchEnabled, setIsDeepResearchEnabled] = useState(false);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const [processingStatusText, setProcessingStatusText] = useState('');

  useEffect(() => {
    try {
      const savedWorkspaces = localStorage.getItem('zuno-workspaces');
      if (savedWorkspaces) setWorkspaces(JSON.parse(savedWorkspaces));
    } catch (error) {
      console.error("Failed to load workspaces from localStorage", error);
      setWorkspaces([]);
    }
  }, []);

  useEffect(() => {
    if (isProcessing) {
      setCurrentLoadingPhrase(loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)]);
      loadingPhraseIntervalRef.current = window.setInterval(() => {
        setCurrentLoadingPhrase(prev => loadingPhrases.filter(p => p !== prev)[Math.floor(Math.random() * (loadingPhrases.length -1))]);
      }, 3500);
    } else {
      if (loadingPhraseIntervalRef.current) clearInterval(loadingPhraseIntervalRef.current);
      if (processingTimerRef.current) clearInterval(processingTimerRef.current);
      setCurrentProcessingProgress(0);
      setEstimatedTimeRemaining(null);
      setProcessingStatusText('');
    }
    return () => { 
        if (loadingPhraseIntervalRef.current) clearInterval(loadingPhraseIntervalRef.current);
        if (processingTimerRef.current) clearInterval(processingTimerRef.current);
    };
  }, [isProcessing]);

  useEffect(() => {
    document.documentElement.classList.remove('theme-dark', 'theme-light');
    document.documentElement.classList.add(`theme-${theme}`);
    localStorage.setItem('zuno-theme', theme);
  }, [theme]);

  useEffect(() => {
    const rootDiv = document.getElementById('root');
    const loadingStateElements = document.body.querySelectorAll('.loading-state > .spinner, .loading-state > p');
    if (rootDiv) {
      rootDiv.style.display = 'block';
      document.body.classList.remove('loading-state');
      loadingStateElements.forEach(el => el.parentElement?.removeChild(el));
    }
  }, []);

  const resetUploadState = useCallback(() => {
    setParsedProperties([]);
    setUploadedFileName(null);
    setIsParsingFile(false);
    setFileParseError(null);
    setIsProcessing(false);
    setBatchProcessingResults(null);
    setShowSummaryModal(false);
    setSummaryData(null);
    setIsDraggingOver(false);
    setCurrentProcessingProgress(0);
    const fileInput = document.getElementById('fileUploader') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }, []);

  const resetManualSearchState = useCallback(() => {
    setManualInputs({ address: '' });
    setIsProcessing(false);
    setManualSearchResult(null);
    setManualSearchError(null);
    setCurrentProcessingProgress(0);
  }, []);

  const handleDashboardViewChange = useCallback((view: AppView) => {
    setCurrentDashboardView(view);
    if (view !== 'new_search' && view !== 'home') {
      resetUploadState();
      resetManualSearchState();
    }
  }, [resetUploadState, resetManualSearchState]);

  const processUploadedFile = useCallback((file: File | null | undefined) => {
    if (!file) return;
    resetUploadState();
    resetManualSearchState();
    setUploadedFileName(file.name);
    setIsParsingFile(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("File data could not be read.");
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        if (jsonData.length === 0) throw new Error("The uploaded Excel file is empty.");
        const properties = parseExcelToPropertyData(jsonData);
        if (properties.length === 0) throw new Error("No valid properties found. Check headers (e.g., 'Address').");
        setParsedProperties(properties);
        setFileParseError(null);
      } catch (err) {
        setFileParseError(`Parse failed: ${err instanceof Error ? err.message : "Unknown error"}.`);
        setParsedProperties([]);
        setUploadedFileName(null);
      } finally {
        setIsParsingFile(false);
      }
    };
    reader.onerror = () => {
      setFileParseError(`Error reading file: ${file.name}.`);
      setIsParsingFile(false);
      setUploadedFileName(null);
    };
    reader.readAsArrayBuffer(file);
  }, [resetUploadState, resetManualSearchState]);

  const handleFileInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    processUploadedFile(event.target.files?.[0]);
  }, [processUploadedFile]);

  const dragEventHandlers = {
    onDragEnter: useCallback((e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); if (!isProcessing) setIsDraggingOver(true); }, [isProcessing]),
    onDragOver: useCallback((e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); if (!isProcessing) setIsDraggingOver(true); }, [isProcessing]),
    onDragLeave: useCallback((e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); }, []),
    onDrop: useCallback((e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);
      if (isProcessing) return;
      const file = e.dataTransfer.files?.[0];
      if (file && ['.xlsx', '.xls'].some(ext => file.name.toLowerCase().endsWith(ext))) {
        processUploadedFile(file);
      } else {
        setFileParseError("Invalid file type. Please upload an .xlsx or .xls file.");
      }
    }, [processUploadedFile, isProcessing]),
  };
  
  const handleClearUpload = useCallback(() => resetUploadState(), [resetUploadState]);

  const mapRawResponseToExcelRow = (property: PropertyData, rawSearchResult: RawGeminiResponse): ExcelRow => {
    let aiStatus: ExcelRow['ai_status'] = 'success';
    if (rawSearchResult.error) {
      aiStatus = 'error';
    } else if (rawSearchResult.status === 'no_match' || !rawSearchResult.best_contact) {
      aiStatus = 'no_match';
    }

    return {
      ...property,
      subject: rawSearchResult.subject,
      best_phone: rawSearchResult.best_contact?.phone,
      best_email: rawSearchResult.best_contact?.email,
      confidence: rawSearchResult.best_contact?.confidence,
      alt_contacts_json: JSON.stringify(rawSearchResult.alt_contacts || [], null, 2),
      search_log_text: (rawSearchResult.search_log || []).join('; '),
      sources_json: JSON.stringify(rawSearchResult.sources || [], null, 2),
      generated_at: rawSearchResult.generated_at,
      ai_status: aiStatus,
      ai_message: rawSearchResult.error || rawSearchResult.message,
      groundingSources: rawSearchResult.groundingSources,
    };
  };

  const handleProcessProperties = useCallback(async () => {
    if (parsedProperties.length === 0) return;
    setIsProcessing(true);
    setBatchProcessingResults(null);
    setShowSummaryModal(false);
    
    const timePerItem = isDeepResearchEnabled ? 35 : 15;
    const totalTime = parsedProperties.length * timePerItem;
    let timeElapsed = 0;
    setEstimatedTimeRemaining(totalTime);
    
    if (processingTimerRef.current) clearInterval(processingTimerRef.current);
    processingTimerRef.current = window.setInterval(() => {
        timeElapsed++;
        setEstimatedTimeRemaining(Math.max(0, totalTime - timeElapsed));
    }, 1000);

    const results: ExcelRow[] = [];
    let contactsFound = 0, errors = 0;

    for (let i = 0; i < parsedProperties.length; i++) {
      const property = parsedProperties[i];
      setCurrentProcessingProgress(Math.round(((i + 1) / parsedProperties.length) * 100));
      setProcessingStatusText(`Processing ${i + 1} of ${parsedProperties.length}: ${property.address}`);
      try {
        const rawResult = await getContactIntelligence(property, isDeepResearchEnabled);
        const excelRow = mapRawResponseToExcelRow(property, rawResult);
        results.push(excelRow);
        if (excelRow.ai_status === 'error') errors++;
        if (excelRow.best_phone || excelRow.best_email) contactsFound++;
      } catch (err) {
        errors++;
        results.push(mapRawResponseToExcelRow(property, { error: `System error: ${err instanceof Error ? err.message : 'Unknown'}` }));
      }
    }
    
    setBatchProcessingResults(results);
    setSummaryData({ 
        totalRecords: parsedProperties.length, 
        recordsSuccessfullyProcessed: parsedProperties.length - errors, 
        recordsWithContacts: contactsFound, 
        errorsEncountered: errors,
        detailedErrors: results.filter(r => r.ai_status === 'error').map(r => ({ recordDetail: `${r.contactName} (ID: ${r.id})`, message: r.ai_message || 'Unknown' }))
    });
    setIsProcessing(false);
    setCurrentProcessingProgress(100);
  }, [parsedProperties, isDeepResearchEnabled, mapRawResponseToExcelRow]);

  const generateAndDownloadExcel = useCallback((data: ExcelRow[]) => {
    const wsData = data.map(item => ({
      'Original Contact': item.contactName,
      'Original Address': [item.address, item.city, item.state, item.zipCode].filter(Boolean).join(', '),
      'Subject (from AI)': item.subject || 'N/A',
      'Best Phone': item.best_phone || 'N/A',
      'Best Email': item.best_email || 'N/A',
      'Confidence': item.confidence || 'N/A',
      'Generated At (UTC)': item.generated_at ? new Date(item.generated_at).toLocaleString() : 'N/A',
      'AI Status': item.ai_status || 'Processed',
      'AI Message': item.ai_message || 'N/A',
      'Alternate Contacts (JSON)': item.alt_contacts_json || '[]',
      'Search Log': item.search_log_text || 'N/A',
      'Data Sources (JSON)': item.sources_json || '[]',
      'Web Sources (URLs)': (item.groundingSources || []).map(s => s.uri).join('; '),
    }));
    const worksheet = XLSX.utils.json_to_sheet(wsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Zuno_Intelligence");
    XLSX.writeFile(workbook, uploadedFileName ? `Zuno_${uploadedFileName}` : "Zuno_Intelligence_Export.xlsx");
  }, [uploadedFileName]);
  
  const handleViewSummary = useCallback(() => { if (summaryData) setShowSummaryModal(true); }, [summaryData]);

  const handleManualInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setManualInputs({ ...manualInputs, [e.target.name]: e.target.value });
  }, [manualInputs]);

  const handleManualSearch = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!manualInputs.address) {
      setManualSearchError("Property Address is required.");
      return;
    }
    setIsProcessing(true);
    setManualSearchResult(null);
    setManualSearchError(null);
    setCurrentProcessingProgress(50); // aesthetic progress
    
    const propertyToSearch: PropertyData = {
      id: 'manual-1',
      address: manualInputs.address!,
      contactName: manualInputs.contactName || '',
    };
    
    try {
      const rawResult = await getContactIntelligence(propertyToSearch, isDeepResearchEnabled);
      const searchResult = mapRawResponseToExcelRow(propertyToSearch, rawResult);
      setManualSearchResult(searchResult);
      if (searchResult.ai_status === 'error') {
        setManualSearchError(searchResult.ai_message || "Manual search failed with an AI processing error.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unknown system error occurred.";
      setManualSearchError(msg);
      setManualSearchResult(mapRawResponseToExcelRow(propertyToSearch, { error: msg }));
    } finally {
      setIsProcessing(false);
      setCurrentProcessingProgress(100);
    }
  }, [manualInputs, mapRawResponseToExcelRow, isDeepResearchEnabled]);

  const handleSaveWorkspace = useCallback((results: ExcelRow[], name?: string) => {
    const workspaceName = name || window.prompt("Enter a name for this workspace:");
    if (!workspaceName?.trim()) return;

    const newWorkspace: Workspace = {
      id: `ws_${Date.now()}`,
      name: workspaceName.trim(),
      createdAt: new Date().toISOString(),
      searches: results
    };
    setWorkspaces(prev => {
      const updated = [newWorkspace, ...prev];
      localStorage.setItem('zuno-workspaces', JSON.stringify(updated));
      return updated;
    });
    alert(`Workspace "${workspaceName.trim()}" saved!`);
    handleDashboardViewChange('workspaces');
  }, [setWorkspaces, handleDashboardViewChange]);
  
  const renderContent = () => {
    switch (currentDashboardView) {
      case 'home':
        return <HomePage userProfile={mockUserProfile} setActiveView={handleDashboardViewChange} isLoadingGlobal={isProcessing} />;
      case 'new_search':
        return <SearchPageContent
            currentDataEntryMode={currentDataEntryMode}
            setCurrentDataEntryMode={setCurrentDataEntryMode}
            resetManualSearchState={resetManualSearchState}
            resetUploadState={resetUploadState}
            dragHandlers={dragEventHandlers}
            handleFileInputChange={handleFileInputChange}
            handleClearUpload={handleClearUpload}
            inputDisabled={isProcessing || isParsingFile}
            isDraggingOver={isDraggingOver}
            uploadedFileName={uploadedFileName}
            isParsingFile={isParsingFile}
            fileParseError={fileParseError}
            parsedProperties={parsedProperties}
            batchProcessingResults={batchProcessingResults}
            handleProcessProperties={handleProcessProperties}
            generateAndDownloadExcel={generateAndDownloadExcel}
            handleViewSummary={handleViewSummary}
            handleSaveWorkspace={handleSaveWorkspace}
            manualInputs={manualInputs}
            handleManualInputChange={handleManualInputChange}
            handleManualSearch={handleManualSearch}
            manualSearchError={manualSearchError}
            manualSearchResult={manualSearchResult}
            isProcessing={isProcessing}
            currentProcessingProgress={currentProcessingProgress}
            currentLoadingPhrase={currentLoadingPhrase}
            showSummaryModal={showSummaryModal}
            summaryData={summaryData}
            setShowSummaryModal={setShowSummaryModal}
            isDeepResearchEnabled={isDeepResearchEnabled}
            setIsDeepResearchEnabled={setIsDeepResearchEnabled}
            estimatedTimeRemaining={estimatedTimeRemaining}
            processingStatusText={processingStatusText}
          />;
      case 'workspaces':
        return <WorkspacePage workspaces={workspaces} setWorkspaces={setWorkspaces} />;
      case 'profile':
        return <ProfilePage userProfile={mockUserProfile} />;
      case 'settings':
        return <SettingsPage currentTheme={theme} onThemeChange={setTheme} />;
      default:
        return <HomePage userProfile={mockUserProfile} setActiveView={handleDashboardViewChange} isLoadingGlobal={isProcessing} />;
    }
  };

  return (
    <div className="min-h-screen bg-primary flex text-primary">
      <Dashboard
        activeView={currentDashboardView}
        setActiveView={handleDashboardViewChange}
        userProfile={mockUserProfile}
        isExpanded={isSidebarExpanded}
        setIsExpanded={setIsSidebarExpanded}
      />
      <main className={`flex-1 h-screen overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;