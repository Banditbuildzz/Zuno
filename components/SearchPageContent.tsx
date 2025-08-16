
import React, { ChangeEvent, DragEvent, FormEvent } from 'react';
import { PropertyData, ExcelRow, DataEntryMode, ProcessingSummary } from '../types'; 
import LoadingSpinner from './LoadingSpinner';
import PropertyCard from './PropertyCard';
import ProcessedPropertyCard from './ProcessedPropertyCard';
import { FolderPlusIcon, MagnifyingGlassIcon, ArrowUpOnSquareIcon, BeakerIcon, DocumentTextIcon, XMarkIcon, CheckCircleIcon, CpuChipIcon } from '@heroicons/react/24/solid';

interface SearchPageContentProps {
  currentDataEntryMode: DataEntryMode;
  setCurrentDataEntryMode: (mode: DataEntryMode) => void;
  resetManualSearchState: () => void;
  resetUploadState: () => void;
  
  dragHandlers: {
    onDragEnter: (event: DragEvent<HTMLDivElement>) => void;
    onDragOver: (event: DragEvent<HTMLDivElement>) => void;
    onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
    onDrop: (event: DragEvent<HTMLDivElement>) => void;
  };
  handleFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void; 
  handleClearUpload: () => void;
  
  inputDisabled: boolean;
  isDraggingOver: boolean;
  uploadedFileName: string | null;
  isParsingFile: boolean;
  fileParseError: string | null;
  parsedProperties: PropertyData[];
  
  batchProcessingResults: ExcelRow[] | null;
  handleProcessProperties: () => Promise<void>;
  generateAndDownloadExcel: (data: ExcelRow[]) => void;
  handleViewSummary: () => void;
  handleSaveWorkspace: (results: ExcelRow[], name?: string) => void;
  
  manualInputs: Partial<PropertyData>;
  handleManualInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleManualSearch: (e: FormEvent) => Promise<void>;
  manualSearchError: string | null;
  manualSearchResult: ExcelRow | null;
  
  isProcessing: boolean; 
  currentProcessingProgress: number;
  currentLoadingPhrase: string;
  processingStatusText: string;
  estimatedTimeRemaining: number | null;

  showSummaryModal: boolean;
  summaryData: ProcessingSummary | null;
  setShowSummaryModal: (show: boolean) => void;

  isDeepResearchEnabled: boolean;
  setIsDeepResearchEnabled: (enabled: boolean) => void;
}

const DeepResearchToggle: React.FC<{
    isEnabled: boolean;
    setIsEnabled: (enabled: boolean) => void;
    disabled: boolean;
}> = ({ isEnabled, setIsEnabled, disabled }) => {
    
    const content = (
        <>
            <div className="flex-shrink-0">
                <button
                    type="button"
                    role="switch"
                    aria-checked={isEnabled}
                    onClick={() => setIsEnabled(!isEnabled)}
                    disabled={disabled}
                    className={`${
                    isEnabled ? 'bg-purple-500' : 'bg-slate-600'
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    <span
                    aria-hidden="true"
                    className={`${
                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                </button>
            </div>
            <div>
                <h4 className="font-semibold text-purple-300 flex items-center gap-2"><BeakerIcon className="w-5 h-5" />Deep Research Mode</h4>
                <p className="text-xs text-slate-400 mt-1">
                    A more exhaustive AI search that takes longer (~35s/item) but can yield higher accuracy contacts.
                </p>
            </div>
        </>
    );

    if (isEnabled) {
        return (
            <div className="animated-purple-gradient-border">
                <div className="inner-content p-4">
                    <div className="flex items-start gap-4">
                        {content}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 transition-all duration-300">
            {content}
        </div>
    )
};

const SearchPageContent: React.FC<SearchPageContentProps> = React.memo(({
  currentDataEntryMode, setCurrentDataEntryMode, resetManualSearchState, resetUploadState,
  dragHandlers, handleFileInputChange, handleClearUpload,
  inputDisabled, isDraggingOver, uploadedFileName, isParsingFile, fileParseError, parsedProperties,
  batchProcessingResults, handleProcessProperties, generateAndDownloadExcel, handleViewSummary, handleSaveWorkspace,
  manualInputs, handleManualInputChange, handleManualSearch, manualSearchError, manualSearchResult,
  isProcessing, currentProcessingProgress, currentLoadingPhrase, processingStatusText, estimatedTimeRemaining,
  showSummaryModal, summaryData, setShowSummaryModal,
  isDeepResearchEnabled, setIsDeepResearchEnabled
}) => {

  const renderLoadingIndicator = () => {
    if (!isProcessing) return null;
    const timeRemainingStr = estimatedTimeRemaining !== null 
      ? `Est. time remaining: ${Math.floor(estimatedTimeRemaining / 60)}m ${estimatedTimeRemaining % 60}s` 
      : '';
    
    return (
      <div className="my-6 text-center max-w-lg mx-auto p-4 frosted-glass-dark rounded-xl">
        <div className="w-full bg-slate-700 rounded-full h-2.5 mb-2 overflow-hidden">
          <div 
            className="bg-sky-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${currentProcessingProgress}%` }}
          ></div>
        </div>
        <p className="text-sm font-semibold text-yellow-400">{currentLoadingPhrase}</p>
        {processingStatusText && <p className="text-xs text-slate-300 mt-1 truncate">{processingStatusText}</p>}
        {timeRemainingStr && <p className="text-xs text-slate-400 mt-1">{timeRemainingStr}</p>}
      </div>
    );
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 flex-grow">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-rose-400 to-lime-400 sm:text-5xl">
          Zuno Search
        </h1>
        <p className="mt-3 text-lg text-slate-300 max-w-3xl mx-auto">
          Find property intelligence by Excel upload or a detailed manual search.
        </p>
      </header>

      <div className="max-w-md mx-auto mb-10 flex justify-center space-x-3">
        <button 
          onClick={() => { setCurrentDataEntryMode('upload'); resetManualSearchState(); }} 
          className={`tab-button ${currentDataEntryMode === 'upload' ? 'active' : ''}`}
        >
          Upload Excel
        </button>
        <button 
          onClick={() => { setCurrentDataEntryMode('manualSearch'); resetUploadState(); }} 
          className={`tab-button ${currentDataEntryMode === 'manualSearch' ? 'active' : ''}`}
        >
          Manual Search
        </button>
      </div>
      
      <div className="max-w-xl mx-auto space-y-6">
        {currentDataEntryMode === 'upload' && (
          <>
            <div 
              className={`transition-all duration-300 ${isDraggingOver && !inputDisabled ? 'scale-105' : ''}`}
              {...dragHandlers}
            >
              <div className="animated-gradient-border-container">
                <div
                  className="inner-content p-6"
                  role="button" 
                  tabIndex={inputDisabled ? -1 : 0} 
                  onClick={() => { if (!inputDisabled) document.getElementById('fileUploader')?.click()}}
                >
                  <div className="text-center">
                      <ArrowUpOnSquareIcon className="w-10 h-10 mx-auto text-sky-400 mb-2"/>
                      <p className="font-semibold text-slate-200">
                      {isDraggingOver && !inputDisabled ? "Release to drop file" : "Drag & drop Excel file here"}
                      </p>
                      <p className="text-sm text-slate-400">or click to select</p>
                  </div>
                  <input type="file" id="fileUploader" accept=".xlsx, .xls" onChange={handleFileInputChange} disabled={inputDisabled} className="sr-only" />
                </div>
              </div>
            </div>
            
            {isParsingFile && (
                <div className="flex items-center justify-center text-yellow-400 text-sm">
                    <LoadingSpinner size="w-5 h-5" color="text-yellow-400" /> <span className="ml-2">Parsing file...</span>
                </div>
            )}
            {fileParseError && <p className="text-sm text-red-400 text-center bg-red-500/10 p-3 rounded-lg">{fileParseError}</p>}

            {(uploadedFileName && !fileParseError && !isParsingFile) && (
                <div className="p-4 bg-slate-800/60 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <DocumentTextIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
                        <div className="min-w-0">
                            <p className="text-sm text-slate-300 truncate" title={uploadedFileName}>{uploadedFileName}</p>
                            <p className="text-xs text-green-400">{parsedProperties.length} valid properties parsed.</p>
                        </div>
                    </div>
                    <button type="button" onClick={handleClearUpload} className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-700/80" 
                        disabled={inputDisabled}>
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
            )}
            
             <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <h4 className="font-semibold text-slate-300 text-sm mb-2">File Requirements</h4>
                <p className="text-xs text-slate-400">Ensure your file is .xlsx or .xls and contains a header row. At a minimum, an `Address` column is required. Common headers like `Owner Name`, `City`, `State` will improve accuracy.</p>
            </div>
            
            {!isProcessing && parsedProperties.length > 0 && !batchProcessingResults && (
              <div className="space-y-4">
                <DeepResearchToggle isEnabled={isDeepResearchEnabled} setIsEnabled={setIsDeepResearchEnabled} disabled={inputDisabled} />
                <button onClick={handleProcessProperties} disabled={inputDisabled}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg flex items-center justify-center text-lg disabled:opacity-60 transition-all">
                  <CpuChipIcon className="w-6 h-6 mr-3"/>
                  <span>Process {parsedProperties.length} Properties</span>
                </button>
              </div>
            )}
          </>
        )}

        {currentDataEntryMode === 'manualSearch' && (
          <div className="p-6 sm:p-8 frosted-glass-dark rounded-2xl space-y-5">
            <h2 className="text-2xl font-semibold text-sky-400 text-center">Manual Property Search</h2>
            <form onSubmit={handleManualSearch} className="space-y-4">
              <div>
                <label htmlFor="manualContactName" className="block text-sm font-medium text-slate-300 mb-1.5">Owner/Business Name (Optional)</label>
                <input type="text" name="contactName" id="manualContactName" value={manualInputs.contactName || ''} onChange={handleManualInputChange}
                      className="w-full input-frosted" placeholder="e.g., John Doe or XYZ LLC" disabled={inputDisabled}/>
              </div>
              <div>
                <label htmlFor="manualAddress" className="block text-sm font-medium text-slate-300 mb-1.5">Property Address <span className="text-red-400">*</span></label>
                <input type="text" name="address" id="manualAddress" value={manualInputs.address || ''} onChange={handleManualInputChange} required
                      className="w-full input-frosted" placeholder="e.g., 123 Main St, Anytown, CA" disabled={inputDisabled}/>
              </div>
              
              {!isProcessing && (
                  <div className="pt-2 space-y-4">
                    <DeepResearchToggle isEnabled={isDeepResearchEnabled} setIsEnabled={setIsDeepResearchEnabled} disabled={inputDisabled} />
                    <button type="submit" disabled={inputDisabled || !manualInputs.address}
                        className="w-full bg-teal-600 hover:bg-teal-500 text-white font-semibold py-3 px-6 rounded-xl shadow-md flex items-center justify-center text-lg disabled:opacity-60 transition-all">
                        <MagnifyingGlassIcon className="w-6 h-6 mr-3"/>Search
                    </button>
                  </div>
              )}
              {manualSearchError && <p className="mt-3 text-sm text-red-400 text-center">{manualSearchError}</p>}
            </form>
          </div>
        )}
      </div>

      {renderLoadingIndicator()}

      {!isProcessing && batchProcessingResults && ( 
        <div className="max-w-xl mx-auto my-6 p-4 frosted-glass-dark rounded-2xl space-y-3">
            <div className="text-center">
                <CheckCircleIcon className="w-12 h-12 text-green-400 mx-auto" />
                <h3 className="text-xl font-bold text-slate-100 mt-2">Processing Complete</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => generateAndDownloadExcel(batchProcessingResults)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center text-sm">
                    <DocumentTextIcon className="w-5 h-5 mr-2"/>Download Excel
                </button>
                <button onClick={handleViewSummary} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center text-sm">
                    <BeakerIcon className="w-5 h-5 mr-2"/>View Summary
                </button>
                <button onClick={() => handleSaveWorkspace(batchProcessingResults, `Batch: ${uploadedFileName}`)} className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center text-sm">
                    <FolderPlusIcon className="w-5 h-5 mr-2"/>Save Workspace
                </button>
            </div>
        </div>
      )}
      
      {showSummaryModal && summaryData && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50" onClick={() => setShowSummaryModal(false)}>
            <div className="frosted-glass-dark p-6 sm:p-8 rounded-[2rem] max-w-lg w-full max-h-[85vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-sky-400">Processing Summary</h2>
                    <button onClick={() => setShowSummaryModal(false)} className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-700/70">
                        <XMarkIcon className="w-7 h-7" />
                    </button>
                </div>
                <div className="text-slate-300 space-y-3.5 text-sm">
                    <p><strong>Total Records Submitted:</strong> {summaryData.totalRecords}</p>
                    <p><strong>Records Successfully Processed:</strong> {summaryData.recordsSuccessfullyProcessed}</p>
                    <p><strong>Records with Contacts Found:</strong> {summaryData.recordsWithContacts}</p>
                    <p><strong>Errors Encountered:</strong> {summaryData.errorsEncountered}</p>

                    {summaryData.detailedErrors.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-red-400 mt-4 mb-2">Detailed Errors:</h3>
                            <ul className="list-disc list-inside space-y-1.5 max-h-60 overflow-y-auto bg-slate-800/50 p-3.5 rounded-xl custom-scrollbar border border-slate-700/50">
                                {summaryData.detailedErrors.map((err, idx) => (<li key={idx}><strong>{err.recordDetail}:</strong> {err.message}</li>))}
                            </ul>
                        </div>
                    )}
                </div>
                 <button onClick={() => setShowSummaryModal(false)} className="mt-8 w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-3 px-4 rounded-xl">Close</button>
            </div>
        </div>
      )}
      
      <div className="mt-12">
        {currentDataEntryMode === 'upload' && batchProcessingResults && !isProcessing && (
          <>
            <h2 className="text-3xl font-semibold text-slate-100 mb-8 text-center">Batch Results for '{uploadedFileName}'</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-[100rem] mx-auto">
              {batchProcessingResults.map(item => (<ProcessedPropertyCard key={item.id} item={item} />))}
            </div>
          </>
        )}

        {currentDataEntryMode === 'upload' && !batchProcessingResults && parsedProperties.length > 0 && !isParsingFile && (
          <>
            <h2 className="text-3xl font-semibold text-slate-100 mb-8 text-center">Preview for '{uploadedFileName}'</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-[100rem] mx-auto">
              {parsedProperties.map(property => (<PropertyCard key={property.id} property={property} />))}
            </div>
          </>
        )}

        {currentDataEntryMode === 'manualSearch' && manualSearchResult && (
             <div className="max-w-xl mx-auto">
                <h2 className="text-3xl font-semibold text-slate-100 mb-8 text-center">Manual Search Result</h2>
                <ProcessedPropertyCard item={manualSearchResult} />

                {manualSearchResult.ai_status === 'success' && (
                  <div className="mt-6 p-4 frosted-glass-dark rounded-2xl">
                    <button
                        onClick={() => handleSaveWorkspace([manualSearchResult], `Manual: ${manualSearchResult.subject}`)}
                        disabled={inputDisabled}
                        className="p-3 text-sm font-medium rounded-lg flex items-center justify-center w-full bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-50"
                    >
                        <FolderPlusIcon className="w-5 h-5 mr-2"/> Save to Workspace
                    </button>
                  </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
});

SearchPageContent.displayName = 'SearchPageContent';

export default SearchPageContent;