import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles, Loader2, CheckCircle, FileText, Eraser, RotateCcw, Settings, Layout, Plus, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Message = ({ role, content, status }) => {
  const isAI = role === 'ai';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col mb-6 ${isAI ? 'items-start' : 'items-end'}`}
    >
      <div className={`flex items-center space-x-2 mb-2 ${isAI ? 'text-primary' : 'text-text-dim'}`}>
        <div className={`p-1.5 rounded-lg ${isAI ? 'bg-primary/10' : 'bg-secondary'}`}>
          {isAI ? <Bot size={14} /> : <User size={14} />}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
          {isAI ? 'Helios AI' : 'You'}
        </span>
      </div>
      
      <div className={`p-4 rounded-2xl max-w-[95%] text-xs leading-relaxed shadow-sm border transition-all ${
        isAI 
        ? 'bg-secondary/50 border-border text-text-main rounded-tl-none' 
        : 'bg-primary border-primary text-white rounded-tr-none'
      }`}>
        <div className="whitespace-pre-wrap">{content}</div>
        
        {status && isAI && (
          <div className="mt-3 pt-3 border-t border-border/30 flex items-center text-[10px] text-text-dim italic">
            {status === 'loading' ? (
              <motion.div 
                animate={{ opacity: [0.4, 1, 0.4] }} 
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="flex items-center"
              >
                <Loader2 size={10} className="animate-spin mr-1.5" /> 
                Thinking...
              </motion.div>
            ) : (
              <div className="flex items-center text-green-400/80">
                <CheckCircle size={10} className="mr-1.5" /> 
                Analysis Complete
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const AIChat = ({ activeFile, projectStructure, projectRoot, onRefreshProject, repoMap, isIndexing, runCommand }) => {
  const [messages, setMessages] = useState([
    // ...
  ]);
  // ...

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    const currentCode = activeFile ? activeFile.content : "// No file active";
    const structureText = JSON.stringify(projectStructure, (key, value) => 
      key === 'children' ? undefined : value, 2);

    try {
      setMessages(prev => [...prev, { role: 'ai', content: "Thinking...", status: 'loading' }]);
      const response = await window.electronAPI.askAI(userMessage, currentCode, structureText, 'chat', selectedModel, repoMap);
      
      setMessages(prev => {
        const updated = [...prev];
        updated.pop();
        return [...updated, { role: 'ai', content: response, status: 'completed' }];
      });

      // 1. Apply File Changes
      const { filesCreated } = await applyAIChanges(response);

      // 2. Handle Terminal Commands (Edit-Verify Loop)
      await handleTerminalRequests(response);

    } catch (err) {
      // ...
    } finally {
      setIsLoading(false);
    }
  };

  const handleTerminalRequests = async (text) => {
    const cmdRegex = /\[CMD:\s*(.+?)\]/g;
    let match;
    while ((match = cmdRegex.exec(text)) !== null) {
      const command = match[1].trim();
      setMessages(prev => [...prev, { role: 'ai', content: `Executing command: \`${command}\`...` }]);
      const result = await runCommand(command);
      
      if (!result.success) {
        setMessages(prev => [...prev, { role: 'ai', content: `⚠️ Command failed. Sending error to Helios for correction...` }]);
        // Self-correction: Send error back to AI
        const correctionResponse = await window.electronAPI.askAI(
          `The command \`${command}\` failed with error: ${result.error || result.stderr}. Please fix the code.`,
          "", "", 'chat', selectedModel, repoMap
        );
        setMessages(prev => [...prev, { role: 'ai', content: correctionResponse, status: 'completed' }]);
        await applyAIChanges(correctionResponse);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: `✅ Command \`${command}\` succeeded.` }]);
      }
    }
  };

  const applyAIChanges = async (text) => {
    if (!projectRoot) return { filesCreated: 0 };
    const fileRegex = /\[FILE:\s*(.+?)\]\s*```[\w]*\n([\s\S]*?)```/g;
    let match;
    let filesCreated = 0;

    while ((match = fileRegex.exec(text)) !== null) {
      const relativePath = match[1].trim();
      const content = match[2];
      let fullPath = relativePath;
      if (!relativePath.includes(':') && !relativePath.startsWith('/') && !relativePath.startsWith('\\')) {
        fullPath = projectRoot.replace(/\\/g, '/') + '/' + relativePath.replace(/\\/g, '/');
      }
      try {
        await window.electronAPI.createFile(fullPath, content);
        filesCreated++;
      } catch (err) {
        console.error(`Failed to create file: ${fullPath}`, err);
      }
    }

    if (filesCreated > 0) {
      onRefreshProject();
    }
    return { filesCreated };
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-sidebar overflow-hidden">
      <div className="h-12 px-4 border-b border-border flex items-center justify-between bg-sidebar">
        <div className="flex items-center space-x-2">
          <span className="text-[12px] font-bold text-text-main uppercase tracking-wider">HELIOS</span>
          {isIndexing && (
            <div className="flex items-center space-x-1 ml-2">
              <Loader2 size={10} className="animate-spin text-primary" />
              <span className="text-[9px] text-text-dim animate-pulse">Indexing...</span>
            </div>
          )}
          {repoMap && !isIndexing && (
            <div className="flex items-center space-x-1 ml-2">
              <CheckCircle size={10} className="text-green-500" />
              <span className="text-[9px] text-text-dim">Context Ready</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-1.5 text-text-dim hover:text-text-main rounded-md">
            <RotateCcw size={14} />
          </button>
          <button 
            onClick={() => setMessages([{ role: 'ai', content: "Chat cleared. How can I help?" }])}
            className="p-1.5 text-text-dim hover:text-text-main rounded-md"
          >
            <Eraser size={14} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className="flex flex-col">
            {msg.role === 'ai' ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="p-1 bg-primary/10 rounded">
                    <Sparkles size={12} className="text-primary" />
                  </div>
                  <span className="text-[11px] font-bold text-text-main">Helios</span>
                  <span className="text-[10px] text-text-dim opacity-50">across the entire codebase.</span>
                </div>
                <div className="text-[13px] text-text-main leading-relaxed whitespace-pre-wrap pl-1">
                  {msg.content}
                </div>
                {msg.status === 'completed' && (
                  <div className="flex items-center space-x-4 pt-2 border-t border-border/30">
                    <div className="flex items-center text-green-400 text-[11px]">
                      <CheckCircle size={12} className="mr-1.5" />
                      Completed
                    </div>
                    <div className="flex items-center text-text-dim text-[11px] hover:text-text-main cursor-pointer">
                      <FileText size={12} className="mr-1.5" />
                      Diff
                    </div>
                    <div className="flex items-center text-text-dim text-[11px]">
                      <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden mr-2">
                        <div className="h-full bg-primary w-[30%]"></div>
                      </div>
                      30%
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-start space-x-2 justify-end">
                <div className="bg-secondary/50 border border-border/50 rounded-lg p-3 max-w-[85%]">
                  <div className="flex items-center space-x-2 mb-1">
                    <User size={12} className="text-text-dim" />
                    <span className="text-[11px] font-bold text-text-main">@Builder</span>
                    <Settings size={10} className="text-text-dim opacity-50" />
                  </div>
                  <div className="text-[12px] text-text-main">
                    {msg.content}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 bg-sidebar border-t border-border">
        <div className="relative bg-secondary/30 border border-border rounded-xl overflow-hidden focus-within:border-primary/50 transition-all">
          <div className="flex items-center px-3 py-2 border-b border-border/30 bg-secondary/10">
            <button className="p-1 text-text-dim hover:text-text-main rounded transition-colors mr-1">
              <Layout size={14} />
            </button>
            <button className="p-1 text-text-dim hover:text-text-main rounded transition-colors mr-2">
              <Plus size={14} />
            </button>
            <div className="flex items-center space-x-1 bg-primary/10 px-2 py-0.5 rounded text-[10px] text-primary border border-primary/20">
              <Sparkles size={10} />
              <span>Mission done and files need review</span>
              <ChevronDown size={10} />
            </div>
          </div>
          <textarea 
            className="w-full bg-transparent p-4 text-[13px] text-text-main placeholder-text-dim/50 focus:outline-none resize-none min-h-[120px]"
            placeholder="now change the ui to this as shown in the picture"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <div className="flex items-center justify-between px-4 pb-3">
            <div className="flex items-center space-x-3 text-text-dim">
              <span className="text-[14px] hover:text-text-main cursor-pointer">@</span>
              <span className="text-[14px] hover:text-text-main cursor-pointer">#</span>
              <FileText size={16} className="hover:text-text-main cursor-pointer" />
            </div>
            <div className="flex items-center space-x-2 relative" ref={menuRef}>
              <button 
                onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                className="flex items-center space-x-1.5 text-[11px] text-text-dim bg-secondary/50 px-2.5 py-1.5 rounded-lg hover:text-text-main hover:bg-secondary transition-all border border-border/30"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${selectedModel === 'smart' ? 'bg-primary animate-pulse' : 'bg-green-400'}`}></div>
                <span>{models.find(m => m.id === selectedModel)?.name || 'Select Model'}</span>
                <ChevronDown size={10} className={`transition-transform duration-200 ${isModelMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isModelMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full right-0 mb-2 w-56 bg-sidebar border border-border rounded-xl shadow-2xl z-50 py-2 overflow-hidden backdrop-blur-xl"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold text-text-dim uppercase tracking-widest border-b border-border/30 mb-1">
                      Available Models
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                      {models.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model.id);
                            setIsModelMenuOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left hover:bg-primary/10 transition-all group flex flex-col space-y-0.5 ${
                            selectedModel === model.id ? 'bg-primary/5' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[12px] font-medium ${selectedModel === model.id ? 'text-primary' : 'text-text-main'}`}>
                              {model.name}
                            </span>
                            {selectedModel === model.id && (
                              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-text-dim opacity-70 group-hover:opacity-100">
                              {model.desc}
                            </span>
                            <span className="text-[9px] text-text-dim/50 uppercase font-bold tracking-tighter">
                              {model.provider}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                className={`p-1.5 rounded-lg transition-all ${
                  !input.trim() || isLoading ? 'text-text-dim cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/80 shadow-lg shadow-primary/20'
                }`}
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
