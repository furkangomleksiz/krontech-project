interface Tab {
  id: string;
  label: string;
  icon: string;
}

interface ProductTabNavProps {
  activeTab?: string;
}

const tabs: Tab[] = [
  { id: "solutions",      label: "Solutions",       icon: "⚙" },
  { id: "how-it-works",   label: "How It Works",    icon: "▶" },
  { id: "key-benefits",   label: "Key Benefits",    icon: "✓" },
  { id: "product-panels", label: "Product Panels",  icon: "⊞" },
  { id: "resources",      label: "Resources",       icon: "↓" },
  { id: "more",           label: "More",            icon: "…" },
];

export function ProductTabNav({ activeTab = "solutions" }: ProductTabNavProps) {
  return (
    <nav className="product-tab-nav" aria-label="Product navigation tabs">
      <div className="product-tab-nav__inner">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-item${tab.id === activeTab ? " tab-item--active" : ""}`}
            aria-current={tab.id === activeTab ? "page" : undefined}
            /* Full tab switching deferred to a future admin/content pass */
            type="button"
          >
            <span className="tab-item__icon" aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
