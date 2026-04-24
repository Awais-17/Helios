import React from 'react';
import { FolderOpen, X, ChevronDown, Command, Search, RotateCcw, ArrowLeft, ArrowRight, Layout, Settings, HelpCircle } from 'lucide-react';

const TitleBar = ({ onOpenFolder, activeFile, projectName }) => {
  return (
    <header className="h-9 bg-activity border-b border-border flex items-center px-3 select-none justify-between overflow-hidden">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 group cursor-default">
          <div className="p-1 bg-primary/10 rounded group-hover:bg-primary/20 transition-colors">
            <Command size={14} className="text-primary" />
          </div>
          <span className="text-[11px] font-bold text-text-main tracking-tight">IDE</span>
        </div>
        
        <div className="flex items-center space-x-0.5">
          <div className="group relative">
            <button 
              className="text-[12px] text-text-dim hover:text-text-main hover:bg-secondary px-2.5 py-1 rounded-md transition-all"
              onClick={onOpenFolder}
            >
              File
            </button>
            <div className="hidden group-hover:block absolute top-full left-0 mt-1 w-48 bg-sidebar border border-border rounded-lg shadow-2xl z-50 py-1 overflow-hidden backdrop-blur-xl">
              <div 
                className="px-4 py-2 text-[11px] text-text-main hover:bg-primary hover:text-white cursor-pointer transition flex justify-between items-center"
                onClick={onOpenFolder}
              >
                <span>Open Folder...</span>
                <span className="opacity-40 text-[9px]">Ctrl+O</span>
              </div>
              <div className="h-px bg-border/50 my-1 mx-2"></div>
              <div 
                className="px-4 py-2 text-[11px] text-red-400 hover:bg-red-500 hover:text-white cursor-pointer transition"
                onClick={() => window.close()}
              >
                Exit
              </div>
            </div>
          </div>
          <button onClick={() => alert('Edit menu coming soon!')} className="text-[12px] text-text-dim hover:text-text-main hover:bg-secondary px-2.5 py-1 rounded-md transition-all">Edit</button>
          <button onClick={() => alert('Selection menu coming soon!')} className="text-[12px] text-text-dim hover:text-text-main hover:bg-secondary px-2.5 py-1 rounded-md transition-all">Selection</button>
          <button onClick={() => alert('View menu coming soon!')} className="text-[12px] text-text-dim hover:text-text-main hover:bg-secondary px-2.5 py-1 rounded-md transition-all">View</button>
          <button onClick={() => alert('Go menu coming soon!')} className="text-[12px] text-text-dim hover:text-text-main hover:bg-secondary px-2.5 py-1 rounded-md transition-all">Go</button>
          <button onClick={() => alert('Run menu coming soon!')} className="text-[12px] text-text-dim hover:text-text-main hover:bg-secondary px-2.5 py-1 rounded-md transition-all">Run</button>
          <button onClick={() => alert('Terminal menu coming soon!')} className="text-[12px] text-text-dim hover:text-text-main hover:bg-secondary px-2.5 py-1 rounded-md transition-all">Terminal</button>
          <button onClick={() => alert('Help menu coming soon!')} className="text-[12px] text-text-dim hover:text-text-main hover:bg-secondary px-2.5 py-1 rounded-md transition-all">Help</button>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center max-w-2xl px-8">
        <div className="flex items-center space-x-3 w-full">
          <div className="text-[12px] text-text-main font-medium whitespace-nowrap">
            {projectName}
          </div>
          <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search size={13} className="text-text-dim group-focus-within:text-primary transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Search" 
              className="w-full bg-secondary/50 border border-border/50 rounded-md py-1 pl-9 pr-4 text-[11px] text-text-main placeholder-text-dim/50 focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-1">
        <button 
          onClick={() => alert('Checking for updates...')}
          className="flex items-center mr-4 bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 rounded-full border border-green-500/20 hover:bg-green-500/20 transition-all"
        >
          <RotateCcw size={10} className="mr-1.5" />
          Restart to Update
        </button>
        
        <div className="flex items-center space-x-1 px-2 border-r border-border/50 mr-2">
          <button onClick={() => alert('Navigate Back')} className="p-1.5 text-text-dim hover:text-text-main rounded-md transition-all">
            <ArrowLeft size={14} />
          </button>
          <button onClick={() => alert('Navigate Forward')} className="p-1.5 text-text-dim hover:text-text-main rounded-md transition-all">
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="flex items-center space-x-0.5">
          <button onClick={() => alert('Change Layout')} className="p-1.5 text-text-dim hover:text-text-main rounded-md transition-all">
            <Layout size={14} />
          </button>
          <button onClick={() => alert('Open Settings')} className="p-1.5 text-text-dim hover:text-text-main rounded-md transition-all">
            <Settings size={14} />
          </button>
          <button onClick={() => alert('Get Help')} className="p-1.5 text-text-dim hover:text-text-main rounded-md transition-all">
            <HelpCircle size={14} />
          </button>
          <button className="p-1.5 text-text-dim hover:text-red-400 rounded-md transition-all ml-2" onClick={() => window.close()}>
            <X size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TitleBar;
