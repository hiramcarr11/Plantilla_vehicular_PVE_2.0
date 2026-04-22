type StatItem = {
  label: string;
  value: string | number;
  helper?: string;
};

type StatsGridProps = {
  items: StatItem[];
};

export function StatsGrid({ items }: StatsGridProps) {
  return (
    <section className="stats-section">
      <div className="stats-grid">
        {items.map((item) => (
          <article className="stats-card" key={item.label}>
            <div className="stats-label">{item.label}</div>
            <div className="stats-value">{item.value}</div>
            {item.helper ? <div className="stats-helper">{item.helper}</div> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
