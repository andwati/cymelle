type ErrorStateProps = {
    title?: string;
    message: string;
    onRetry?: () => void;
};

export function ErrorState({
                               title = "Something went wrong",
                               message,
                               onRetry,
                           }: ErrorStateProps) {
    return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <h3 className="font-semibold text-red-900">{title}</h3>
            <p className="mt-1 text-sm text-red-700">{message}</p>

            {onRetry ? (
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
                >
                    Try again
                </button>
            ) : null}
        </div>
    );
}