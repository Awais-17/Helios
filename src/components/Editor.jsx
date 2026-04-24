import React from 'react';
import MonacoEditor, { useMonaco } from '@monaco-editor/react';
import { X, FileCode, Cpu } from 'lucide-react';
import useInlineCompletions from '../hooks/useInlineCompletions';
import { motion, AnimatePresence } from 'framer-motion';

const Editor = ({ activeFile, openFiles, onFileChange, onCloseFile, onSetActive, projectStructure }) => {
  const monaco = useMonaco();
  useInlineCompletions(monaco, activeFile, projectStructure);

  const getLanguage = (fileName) => {
    if (!fileName) return 'plaintext';
    const ext = fileName.split('.').pop().toLowerCase();
    const map = {
      'js': 'javascript', 'jsx': 'javascript',
      'ts': 'typescript', 'tsx': 'typescript',
      'html': 'html', 'css': 'css', 'json': 'json',
      'md': 'markdown', 'py': 'python', 'go': 'go',
      'rs': 'rust', 'cpp': 'cpp', 'c': 'c',
    };
    return map[ext] || 'plaintext';
  };

  if (!activeFile && openFiles.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background text-text-dim select-none p-10">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center text-center max-w-2xl"
        >
          <div className="w-16 h-16 mb-8 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10 relative">
            <Cpu size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-text-main mb-4 tracking-tight">Helios</h1>
          <p className="text-[13px] text-text-dim/60 mb-12 max-w-md leading-relaxed">
            Your AI-native environment is ready. Helios understands your entire codebase and helps you build faster with context-aware intelligence.
          </p>
          
          <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
            <div className="p-4 bg-secondary/20 rounded-xl border border-border/50 text-[12px] hover:bg-secondary/40 transition-all cursor-pointer group flex items-center justify-between">
              <div className="flex flex-col items-start">
                <span className="text-text-main font-bold mb-0.5">Open Folder</span>
                <span className="text-[10px] opacity-40 uppercase tracking-wider">Project Root</span>
              </div>
              <span className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] opacity-60">Ctrl + O</span>
            </div>
            <div className="p-4 bg-secondary/20 rounded-xl border border-border/50 text-[12px] hover:bg-secondary/40 transition-all cursor-pointer group flex items-center justify-between">
              <div className="flex flex-col items-start">
                <span className="text-text-main font-bold mb-0.5">AI Chat</span>
                <span className="text-[10px] opacity-40 uppercase tracking-wider">Helios Intelligence</span>
              </div>
              <span className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] opacity-60">Ctrl + L</span>
            </div>
          </div>

          <div className="mt-16 text-[10px] text-text-dim/30 font-bold uppercase tracking-[0.3em]">
            Powered by GPT-4o & Helios Intelligence
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden relative">
      {/* Trae-like Minimal Tabs Bar */}
      <div className="flex bg-activity/30 border-b border-border/50 overflow-x-auto select-none no-scrollbar h-9 items-center">
        <AnimatePresence>
          {openFiles.map((file, idx) => (
            <motion.div 
              key={file.path}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`flex items-center px-4 h-full text-[11px] transition-all min-w-fit max-w-[200px] relative group cursor-pointer border-r border-border/30 ${
                activeFile?.path === file.path 
                ? 'bg-background text-text-main border-t-2 border-t-primary' 
                : 'text-text-dim hover:bg-secondary/30'
              }`}
              onClick={() => onSetActive(file)}
            >
              <FileCode size={13} className={`mr-2.5 flex-shrink-0 ${activeFile?.path === file.path ? 'text-primary' : ''}`} />
              <span className="truncate mr-3">{file.name}</span>
              <button 
                className="opacity-0 group-hover:opacity-100 hover:bg-secondary/50 p-0.5 rounded transition ml-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseFile(file.path);
                }}
              >
                <X size={10} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 min-h-0 relative group">
        <AnimatePresence mode="wait">
          {activeFile ? (
            <motion.div 
              key={activeFile.path}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <MonacoEditor
                height="100%"
                theme="vs-dark"
                path={activeFile.path}
                defaultLanguage={getLanguage(activeFile.name)}
                value={activeFile.content}
                onChange={onFileChange}
                options={{
                  fontSize: 13,
                  minimap: { enabled: false },
                  automaticLayout: true,
                  padding: { top: 20 },
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  smoothScrolling: true,
                  scrollBeyondLastLine: true,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontLigatures: true,
                  lineHeight: 1.8,
                  bracketPairColorization: { enabled: true },
                  guides: { indentation: true },
                  renderLineHighlight: 'all',
                  scrollbar: {
                    vertical: 'hidden',
                    horizontal: 'hidden'
                  }
                }}
              />
            </motion.div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-dim/20 font-bold uppercase tracking-[1em] text-4xl">
              Helios
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Editor;
