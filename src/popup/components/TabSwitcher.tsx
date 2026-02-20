interface TabSwitcherProps {
  tabs: string[];
  activeTab: number;
  onTabChange: (index: number) => void;
}

export default function TabSwitcher({ tabs, activeTab, onTabChange }: TabSwitcherProps) {
  return (
    <div className="flex border-b border-gray-200">
      {tabs.map((tab, index) => (
        <button
          key={tab}
          className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${
            index === activeTab
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => onTabChange(index)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
