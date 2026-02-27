interface TabSwitcherProps {
  tabs: string[];
  activeTab: number;
  onTabChange: (index: number) => void;
}

export default function TabSwitcher({ tabs, activeTab, onTabChange }: TabSwitcherProps) {
  return (
    <div className="flex bg-gray-100/80 rounded-xl p-0.5">
      {tabs.map((tab, index) => (
        <button
          key={tab}
          className={`flex-1 py-1.5 text-sm font-medium text-center transition-all rounded-lg ${
            index === activeTab
              ? 'bg-white text-[#7C3AED] shadow-card'
              : 'text-gray-400 hover:text-gray-600'
          }`}
          onClick={() => onTabChange(index)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
