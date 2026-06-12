import {useFareCalculation} from "#/hooks/useFareCalculation";
import {formatCurrency} from "#/hooks/formatCurrency";
import {Calculator} from "lucide-react";
import {useState} from "react";

export function FareCalculatorCard() {
    const [distanceKm, setDistanceKm] = useState("10");
    const [surgeMultiplier, setSurgeMultiplier] = useState("1.0");
    const [validationError, setValidationError] = useState<string | null>(null);

    const fareMutation = useFareCalculation();

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const distance = Number(distanceKm);
        const surge = surgeMultiplier ? Number(surgeMultiplier) : undefined;

        if (Number.isNaN(distance) || distance <= 0) {
            setValidationError("Distance must be greater than 0.");
            return;
        }

        if (surge !== undefined && (Number.isNaN(surge) || surge < 1)) {
            setValidationError("Surge multiplier must be at least 1.0.");
            return;
        }

        setValidationError(null);

        fareMutation.mutate({
            distanceKm: distance,
            surgeMultiplier: surge,
        });
    }

    const data = fareMutation.data;

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
                <div className="rounded-lg bg-slate-900 p-2 text-white">
                    <Calculator size={18}/>
                </div>
                <div>
                    <h2 className="font-semibold text-slate-900">Fare calculator</h2>
                    <p className="text-sm text-slate-500">
                        Base fare + distance rate, with surge and minimum fare applied.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-3">
                <label className="space-y-1">
          <span className="text-xs font-medium text-slate-600">
            Distance KM
          </span>
                    <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={distanceKm}
                        onChange={(event) => setDistanceKm(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                    />
                </label>

                <label className="space-y-1">
          <span className="text-xs font-medium text-slate-600">
            Surge multiplier
          </span>
                    <input
                        type="number"
                        min="1"
                        step="0.1"
                        value={surgeMultiplier}
                        onChange={(event) => setSurgeMultiplier(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                    />
                </label>

                <div className="flex items-end">
                    <button
                        type="submit"
                        disabled={fareMutation.isPending}
                        className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {fareMutation.isPending ? "Calculating..." : "Calculate fare"}
                    </button>
                </div>
            </form>

            {validationError ? (
                <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                    {validationError}
                </p>
            ) : null}

            {fareMutation.isError ? (
                <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {fareMutation.error instanceof Error
                        ? fareMutation.error.message
                        : "Failed to calculate fare"}
                </p>
            ) : null}

            {data ? (
                <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-5">
                    <FareMetric
                        label="Base"
                        value={formatCurrency(data.baseFare, data.currency)}
                    />
                    <FareMetric
                        label="Per KM"
                        value={formatCurrency(data.perKmRate, data.currency)}
                    />
                    <FareMetric label="Surge" value={`${data.surgeMultiplier}x`}/>
                    <FareMetric
                        label="Minimum"
                        value={formatCurrency(data.minimumFare, data.currency)}
                    />
                    <FareMetric
                        label="Total"
                        value={formatCurrency(data.calculatedFare, data.currency)}
                        strong
                    />
                </div>
            ) : null}
        </section>
    );
}

type FareMetricProps = {
    label: string;
    value: string;
    strong?: boolean;
};

function FareMetric({label, value, strong = false}: FareMetricProps) {
    return (
        <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p
                className={
                    strong
                        ? "mt-1 text-lg font-bold text-slate-900"
                        : "mt-1 font-semibold text-slate-800"
                }
            >
                {value}
            </p>
        </div>
    );
}