type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
};

export function PageIntro({ eyebrow, title, description, actions }: PageIntroProps) {
  return (
    <div className="page-intro">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="page-intro-title">{title}</h2>
        <p className="page-intro-description">{description}</p>
      </div>
      {actions ? <div className="page-intro-actions">{actions}</div> : null}
    </div>
  );
}
