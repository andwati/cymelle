import {Button} from "#/components/ui/button";
import {Input} from "#/components/ui/input";

type QuantityStepperProps = {
    value: number;
    min?: number;
    max: number;
    disabled?: boolean;
    onChange: (value: number) => void;
};

export function QuantityStepper({
    value,
    min = 1,
    max,
    disabled = false,
    onChange,
}: QuantityStepperProps) {
    const normalizedMax = Math.max(max, min);

    function setQuantity(nextValue: number) {
        if (Number.isNaN(nextValue)) {
            onChange(min);
            return;
        }

        onChange(Math.min(Math.max(nextValue, min), normalizedMax));
    }

    return (
        <div className="inline-grid grid-cols-[2.25rem_4rem_2.25rem] overflow-hidden rounded-md border border-input">
            <Button
                type="button"
                variant="secondary"
                disabled={disabled || value <= min}
                onClick={() => setQuantity(value - 1)}
                className="h-9 rounded-none border-0 shadow-none"
            >
                -
            </Button>
            <Input
                type="number"
                min={min}
                max={normalizedMax}
                value={value}
                disabled={disabled}
                onChange={(event) => setQuantity(Number(event.target.value))}
                className="h-9 rounded-none border-y-0 px-2 text-center shadow-none"
            />
            <Button
                type="button"
                variant="secondary"
                disabled={disabled || value >= normalizedMax}
                onClick={() => setQuantity(value + 1)}
                className="h-9 rounded-none border-0 shadow-none"
            >
                +
            </Button>
        </div>
    );
}
