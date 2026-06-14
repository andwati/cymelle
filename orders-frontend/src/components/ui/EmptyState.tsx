type EmptyStateProps = {
	title: string;
	description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
	return (
		<div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
			<h3 className="font-semibold text-slate-900">{title}</h3>
			<p className="mt-1 text-sm text-slate-500">{description}</p>
		</div>
	);
}
