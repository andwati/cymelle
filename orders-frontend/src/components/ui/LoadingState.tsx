type LoadingStateProps = {
    title?: string;
    description?: string;
};

export function LoadingState({
                                 title = "Loading",
                                 description = "Fetching the latest data...",
                             }: LoadingStateProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div
                className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"/>
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
    );
}