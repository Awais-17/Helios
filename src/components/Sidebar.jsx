import React, { useState } from 'react';
import { FileCode, Folder, ChevronRight, ChevronDown, FolderOpen, Plus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarItem = ({ item, level, onOpenFile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isDirectory = item.type === 'directory';

  const handleClick = () => {
    if (isDirectory) {
      setIsOpen(!isOpen);
    } else {
      onOpenFile(item.path);
    }
  };

  return (
    <div className="select-none">
      <div 
        className={`flex items-center py-1.5 px-3 cursor-pointer transition-colors group ${
          isDirectory ? 'text-text-main/80 hover:text-text-main' : 'text-text-dim hover:text-text-main hover:bg-secondary/50'
        }`}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center flex-1 min-w-0">
          {isDirectory && (
            <motion.div
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="mr-1 opacity-60"
            >
              <ChevronRight size={14} strokeWidth={2} />
            </motion.div>
          )}
          {!isDirectory && <div className="w-4"></div>}
          
          <div className="mr-2 opacity-80">
            {isDirectory ? (
              <Folder size={16} className={isOpen ? 'text-primary' : 'text-text-dim'} fill={isOpen ? 'currentColor' : 'none'} fillOpacity={0.2} />
            ) : (
              <FileCode size={16} className="text-text-dim group-hover:text-primary transition-colors" />
            )}
          </div>
          
          <span className={`text-[12px] truncate ${!isDirectory && 'group-hover:translate-x-0.5 transition-transform'}`}>
            {item.name}
          </span>
        </div>
      </div>
      
      <AnimatePresence>
        {isDirectory && isOpen && item.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {item.children.map((child, idx) => (
              <SidebarItem key={idx} item={child} level={level + 1} onOpenFile={onOpenFile} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Sidebar = ({ structure, onOpenFile, projectRoot }) => {
  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-border shadow-2xl">
      <div className="h-12 px-4 flex items-center justify-between border-b border-border/50 bg-sidebar/50">
        <span className="text-[11px] font-bold uppercase text-text-dim tracking-widest">Explorer</span>
        <div className="flex items-center space-x-1">
          <button className="p-1.5 text-text-dim hover:text-text-main hover:bg-secondary rounded-md transition-all">
            <Plus size={14} strokeWidth={1.5} />
          </button>
          <button className="p-1.5 text-text-dim hover:text-text-main hover:bg-secondary rounded-md transition-all">
            <Search size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-3 no-scrollbar">
        {projectRoot ? (
          <div className="px-2 mb-2">
            <div className="flex items-center px-2 py-1 mb-1 text-[10px] font-bold text-primary/60 uppercase tracking-tighter">
              Project Root
            </div>
            <div className="text-[11px] px-2 text-text-dim truncate mb-4 opacity-50">
              {projectRoot.split(/[\\/]/).pop()}
            </div>
          </div>
        ) : null}

        {structure.length > 0 ? (
          structure.map((item, idx) => (
            <SidebarItem key={idx} item={item} level={0} onOpenFile={onOpenFile} />
          ))
        ) : (
          <div className="px-8 py-10 text-center flex flex-col items-center justify-center">
            <FolderOpen size={32} className="text-border mb-4 opacity-20" />
            <div className="text-[11px] text-text-dim/40 italic">
              No folder selected
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
