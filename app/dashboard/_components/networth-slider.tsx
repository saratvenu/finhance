"use client";

interface NetWorthSliderProps {
  years: number;
  onYearsChange: (years: number) => void;

  interestRate?: number;
  onInterestChange?: (rate: number) => void;

  inflationRate?: number;
  onInflationChange?: (rate: number) => void;
}

export default function NetWorthSlider({
  years,
  onYearsChange,

  interestRate = 0.1,
  onInterestChange = () => {},

  inflationRate = 0.05,
  onInflationChange = () => {},
}: NetWorthSliderProps) {
  return (
    <div className="space-y-6">
      {/* Projection Period (full width) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Projection Period
          </span>
          <span className="text-sm font-medium">
            {years} years
          </span>
        </div>

        <input
          type="range"
          min={1}
          max={30}
          value={years}
          onChange={(e) =>
            onYearsChange(Number(e.target.value))
          }
          className="w-full accent-cyan-400 cursor-pointer"
        />
      </div>

      {/* Interest + Inflation  */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Interest rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Interest Rate
            </span>
            <span className="text-sm font-medium">
              {(interestRate * 100).toFixed(1)}%
            </span>
          </div>

          <input
            type="range"
            min={4}
            max={15}
            step={0.5}
            value={Number((interestRate * 100).toFixed(1))}
            onChange={(e) =>
              onInterestChange(
                Number(e.target.value) / 100
              )
            }
            className="w-full accent-emerald-400 cursor-pointer"
          />
        </div>

        {/* Inflation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Inflation
            </span>
            <span className="text-sm font-medium">
              {(inflationRate * 100).toFixed(1)}%
            </span>
          </div>

          <input
            type="range"
            min={2}
            max={8}
            step={0.5}
            value={Number((inflationRate * 100).toFixed(1))}
            onChange={(e) =>
              onInflationChange(
                Number(e.target.value) / 100
              )
            }
            className="w-full accent-orange-400 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
