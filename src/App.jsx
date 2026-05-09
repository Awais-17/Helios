import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import AIChat from './components/AIChat';
import TitleBar from './components/TitleBar';
import ActivityBar from './components/ActivityBar';
import { motion, AnimatePresence } from 'framer-motion';

const App = () => {
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [projectRoot, setProjectRoot] = useState(null);
  const [projectStructure, setProjectStructure] = useState([]);
  const [repoMap, setRepoMap] = useState(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [activeTab, setActiveTab] = useState('explorer'); 
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [showChat, setShowChat] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [terminalOutput, setTerminalOutput] = useState([]);

  // ... (inside App component)

  const runCommand = async (command) => {
    if (!projectRoot || !window.electronAPI) return;
    
    setTerminalOutput(prev => [...prev, { type: 'input', content: command }]);
    
    try {
      const result = await window.electronAPI.runTerminalCommand(command, projectRoot);
      if (result.stdout) setTerminalOutput(prev => [...prev, { type: 'stdout', content: result.stdout }]);
      if (result.stderr) setTerminalOutput(prev => [...prev, { type: 'stderr', content: result.stderr }]);
      if (result.error) setTerminalOutput(prev => [...prev, { type: 'error', content: result.error }]);
      return result;
    } catch (err) {
      setTerminalOutput(prev => [...prev, { type: 'error', content: err.message }]);
      return { success: false, error: err.message };
    }
  };
  useEffect(() => {
    if (projectRoot) {
      refreshProjectStructure();
    }
  }, [projectRoot]);

  // Check if we are running in Electron
  useEffect(() => {
    if (!window.electronAPI) {
      console.error("Electron API not found. Please make sure you are running this app inside Electron.");
    }
  }, []);

  const refreshProjectStructure = async () => {
    if (!window.electronAPI) return;
    try {
      const structure = await window.electronAPI.getProjectStructure(projectRoot);
      setProjectStructure(structure);
      
      // Also re-index if needed, or just refresh structure
      if (projectRoot) {
        setIsIndexing(true);
        const map = await window.electronAPI.indexProject(projectRoot);
        setRepoMap(map);
        setIsIndexing(false);
      }
    } catch (err) {
      console.error("Failed to refresh project structure:", err);
      setIsIndexing(false);
    }
  };

  const handleOpenFile = async (path) => {
    // Check if already open
    const alreadyOpen = openFiles.find(f => f.path === path);
    if (alreadyOpen) {
      setActiveFile(alreadyOpen);
      return;
    }

    try {
      const content = await window.electronAPI.readFile(path);
      const fileName = path.split(/[\\/]/).pop();
      const newFile = { path, name: fileName, content };
      setOpenFiles([...openFiles, newFile]);
      setActiveFile(newFile);
    } catch (err) {
      console.error("Failed to open file:", err);
    }
  };

  const handleCloseFile = (path) => {
    const filtered = openFiles.filter(f => f.path !== path);
    setOpenFiles(filtered);
    if (activeFile?.path === path) {
      setActiveFile(filtered.length > 0 ? filtered[filtered.length - 1] : null);
    }
  };

  const handleOpenFolder = async () => {
    const result = await window.electronAPI.openFolder();
    if (result) {
      setProjectRoot(result.folderPath);
      setProjectStructure(result.structure);
      
      // Trigger indexing
      setIsIndexing(true);
      try {
        const map = await window.electronAPI.indexProject(result.folderPath);
        setRepoMap(map);
      } catch (err) {
        console.error("Indexing failed:", err);
      } finally {
        setIsIndexing(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-inter select-none">
      {/* Helios-like Title Bar */}
      <TitleBar 
        onOpenFolder={handleOpenFolder} 
        activeFile={activeFile} 
        projectName={projectRoot?.split(/[\\/]/).pop() || 'my-ai-editor'}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Helios-like Activity Bar (Slim Left Bar) */}
        <ActivityBar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          onToggleChat={() => setShowChat(!showChat)}
          chatActive={showChat}
          onToggleTerminal={() => setShowTerminal(!showTerminal)}
          terminalActive={showTerminal}
        />

        {/* Explorer Sidebar */}
        <AnimatePresence>
          {activeTab === 'explorer' && (
            <motion.div 
              className="bg-sidebar border-r border-border overflow-hidden"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: sidebarWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sidebar 
                structure={projectStructure} 
                onOpenFile={handleOpenFile} 
                projectRoot={projectRoot}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center: Monaco Editor with status bar */}
        <main className="flex-1 flex flex-col min-w-0 bg-background relative overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0">
            <Editor 
              activeFile={activeFile} 
              openFiles={openFiles}
              projectStructure={projectStructure}
              onFileChange={(content) => {
                if (activeFile) {
                  setActiveFile({ ...activeFile, content });
                  setOpenFiles(openFiles.map(f => f.path === activeFile.path ? { ...f, content } : f));
                }
              }}
              onCloseFile={handleCloseFile}
              onSetActive={setActiveFile}
            />
          </div>

          {/* Terminal / Output Area */}
          <AnimatePresence>
            {showTerminal && (
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: 200 }}
                exit={{ height: 0 }}
                className="bg-activity border-t border-border flex flex-col"
              >
                <div className="h-9 px-4 flex items-center space-x-6 border-b border-border/50 text-[11px] font-medium text-text-dim">
                  <span className="text-text-main border-b-2 border-primary h-full flex items-center px-1 cursor-pointer">Problems 1</span>
                  <span className="hover:text-text-main cursor-pointer h-full flex items-center px-1">Output</span>
                  <span className="hover:text-text-main cursor-pointer h-full flex items-center px-1">Debug Console</span>
                  <span className="text-text-main border-b-2 border-primary h-full flex items-center px-1 cursor-pointer">Terminal</span>
                </div>
                <div className="flex-1 p-4 font-mono text-[12px] text-text-main overflow-y-auto">
                  {terminalOutput.map((out, idx) => (
                    <div key={idx} className="mb-1">
                      {out.type === 'input' && <div className="flex space-x-2"><span className="text-green-400">PS&gt;</span><span>{out.content}</span></div>}
                      {out.type === 'stdout' && <pre className="whitespace-pre-wrap">{out.content}</pre>}
                      {out.type === 'stderr' && <pre className="whitespace-pre-wrap text-yellow-500">{out.content}</pre>}
                      {out.type === 'error' && <pre className="whitespace-pre-wrap text-red-500">{out.content}</pre>}
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">PS</span>
                    <span>{projectRoot || 'C:\\Users\\mdawa\\...'} &gt;</span>
                    <span className="animate-pulse">_</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Status Bar */}
          <footer className="h-6 bg-activity border-t border-border flex items-center px-4 justify-between text-[10px] text-text-dim">
            <div className="flex items-center space-x-4">
              <span className="hover:text-primary cursor-pointer transition flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Helios AI: Connected
              </span>
              <span className="hover:text-primary cursor-pointer transition">UTF-8</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="hover:text-primary cursor-pointer transition">{activeFile?.name || 'No file'}</span>
              <span className="hover:text-primary cursor-pointer transition">React / JavaScript</span>
            </div>
          </footer>
        </main>

        {/* Right Sidebar: AI Chat */}
        <AnimatePresence>
          {showChat && (
            <motion.div 
              className="bg-sidebar border-l border-border overflow-hidden"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 400, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AIChat 
                activeFile={activeFile} 
                projectStructure={projectStructure}
                projectRoot={projectRoot}
                onRefreshProject={refreshProjectStructure}
                repoMap={repoMap}
                isIndexing={isIndexing}
                runCommand={runCommand}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;
