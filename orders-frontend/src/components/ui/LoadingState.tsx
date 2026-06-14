type LoadingStateProps = {
	title?: string;
};

export function LoadingState({ title = "Loading" }: LoadingStateProps) {
	return (
		<output
			className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm"
			aria-label={title}
		>
			<div className="space-y-3">
				<div className="h-4 w-36 animate-pulse rounded-md bg-muted" />
				<div className="h-8 w-full animate-pulse rounded-md bg-muted" />
				<div className="grid gap-3 md:grid-cols-3">
					<div className="h-16 animate-pulse rounded-md bg-muted" />
					<div className="h-16 animate-pulse rounded-md bg-muted" />
					<div className="h-16 animate-pulse rounded-md bg-muted" />
				</div>
			</div>
		</output>
	);
}
