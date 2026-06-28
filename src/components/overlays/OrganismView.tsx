type OrganismViewProps = {
  ascii: string;
};

export function OrganismView({ ascii }: OrganismViewProps) {
  return (
    <div className="organism-view" aria-label="Living organism">
      <pre className="organism-view__ascii">{ascii}</pre>
    </div>
  );
}
