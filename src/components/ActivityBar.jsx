import React from 'react';
import { Files, MessageSquare, Settings, User, Terminal } from 'lucide-react';

const ActivityBar = ({ activeTab, onTabChange, onToggleChat, chatActive, onToggleTerminal, terminalActive }) => {
  const tabs = [
    { id: 'explorer', icon: Files, label: 'Explorer' },
  ];

  return (
    <aside className="w-12 bg-activity border-r border-border flex flex-col items-center py-4 justify-between">
      <div className="flex flex-col items-center space-y-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`p-2 rounded-lg transition-all duration-200 group relative ${activeTab === tab.id ? 'text-primary bg-secondary' : 'text-text-dim hover:text-text-main hover:bg-secondary'}`}
            title={tab.label}
          >
            <tab.icon size={20} strokeWidth={1.5} />
            {activeTab === tab.id && (
              <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-primary rounded-r-full"></div>
            )}
          </button>
        ))}
        
        {/* Chat Toggle Button */}
        <button
          onClick={onToggleChat}
          className={`p-2 rounded-lg transition-all duration-200 group relative ${chatActive ? 'text-primary bg-secondary' : 'text-text-dim hover:text-text-main hover:bg-secondary'}`}
          title="Helios Chat"
        >
          <MessageSquare size={20} strokeWidth={1.5} />
          {chatActive && (
            <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-primary rounded-r-full"></div>
          )}
        </button>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <button 
          onClick={onToggleTerminal}
          className={`p-2 rounded-lg transition-all duration-200 group relative ${terminalActive ? 'text-primary bg-secondary' : 'text-text-dim hover:text-text-main hover:bg-secondary'}`}
          title="Toggle Terminal"
        >
          <Terminal size={20} strokeWidth={1.5} />
          {terminalActive && (
            <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-primary rounded-r-full"></div>
          )}
        </button>
        <button 
          onClick={() => alert('User Profile coming soon!')}
          className="p-2 text-text-dim hover:text-text-main transition-colors"
          title="User Profile"
        >
          <User size={20} strokeWidth={1.5} />
        </button>
        <button 
          onClick={() => alert('Settings coming soon!')}
          className="p-2 text-text-dim hover:text-text-main transition-colors"
          title="Settings"
        >
          <Settings size={20} strokeWidth={1.5} />
        </button>
      </div>
    </aside>
  );
};

export default ActivityBar;
