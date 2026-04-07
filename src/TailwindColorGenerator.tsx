import { useState, useEffect, useCallback } from "react";
import tinycolor from "tinycolor2";
import { Copy, Check, Pipette } from "lucide-react";
import { cn } from "./lib/utils";

const TAILWIND_COLOR_NAMES = [
  "blue", "red", "green", "yellow", "indigo", "purple", "pink", "gray",
  "slate", "zinc", "neutral", "stone", "lime", "emerald", "teal", "cyan",
  "sky", "violet", "fuchsia", "rose", "orange", "amber",
];

// Derived from averaging Tailwind's official palettes (blue, red, green, amber, purple).
// Each step defines how far to interpolate from the 500 base towards white (light side)
// or towards black (dark side), plus a saturation multiplier relative to the input.
const STEP_CONFIG = [
  { step: "50",  lightPos: 0.93,  satMult: 1.06 },
  { step: "100", lightPos: 0.85,  satMult: 1.07 },
  { step: "200", lightPos: 0.72,  satMult: 1.09 },
  { step: "300", lightPos: 0.53,  satMult: 1.09 },
  { step: "400", lightPos: 0.26,  satMult: 1.06 },
  { step: "500", lightPos: 0,     satMult: 1.00 },
  { step: "600", lightPos: -0.15, satMult: 0.88 },
  { step: "700", lightPos: -0.27, satMult: 0.86 },
  { step: "800", lightPos: -0.40, satMult: 0.81 },
  { step: "900", lightPos: -0.51, satMult: 0.73 },
  { step: "950", lightPos: -0.73, satMult: 0.76 },
];

interface ColorPalette {
  [key: string]: string;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function generateTailwindPalette(baseColor: string): ColorPalette {
  const base = tinycolor(baseColor);
  if (!base.isValid()) return {};

  const hsl = base.toHsl();
  const baseH = hsl.h;
  const baseS = hsl.s;
  const baseL = hsl.l;

  return Object.fromEntries(
    STEP_CONFIG.map(({ step, lightPos, satMult }) => {
      let l: number;
      if (lightPos >= 0) {
        // Lighter than 500: interpolate from baseL towards 1.0 (white)
        l = baseL + lightPos * (1.0 - baseL);
      } else {
        // Darker than 500: interpolate from baseL towards 0.0 (black)
        l = baseL + lightPos * baseL;
      }
      l = clamp(l, 0.03, 0.98);

      // Saturation: scale relative to input, clamped
      const s = clamp(baseS * satMult, 0.0, 1.0);

      // Subtle hue shift: darks shift ~4 degrees warm, lights shift ~2 degrees cool
      // This mimics the hand-tuning in Tailwind's official palettes
      let hueShift = 0;
      if (lightPos < 0) {
        hueShift = Math.abs(lightPos) * 5; // up to ~3.7 degrees for 950
      } else if (lightPos > 0) {
        hueShift = lightPos * -2; // up to ~-1.9 degrees for 50
      }
      const h = (baseH + hueShift + 360) % 360;

      const color = tinycolor({ h, s, l });
      return [step, color.toHexString()];
    })
  );
}

export default function TailwindColorGenerator() {
  const [inputColor, setInputColor] = useState("#3b82f6");
  const [generated, setGenerated] = useState<ColorPalette>(() =>
    generateTailwindPalette("#3b82f6")
  );
  const [colorName, setColorName] = useState("custom");
  const [customName, setCustomName] = useState("");
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  useEffect(() => {
    setGenerated(generateTailwindPalette(inputColor));
  }, [inputColor]);

  const varPrefix = colorName === "custom" ? customName || "custom" : colorName;

  const cssSnippet = `:root {\n${Object.entries(generated)
    .map(([key, value]) => `  --color-${varPrefix}-${key}: ${value};`)
    .join("\n")}\n}`;

  const tailwindConfigSnippet = `${varPrefix}: {\n${Object.entries(generated)
    .map(([key]) => `    ${key}: 'var(--color-${varPrefix}-${key})',`)
    .join("\n")}\n  }`;

  const tailwindV4Snippet = `@theme {\n${Object.entries(generated)
    .map(([key, value]) => `  --color-${varPrefix}-${key}: ${value};`)
    .join("\n")}\n}`;

  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedValue(id);
      setTimeout(() => setCopiedValue(null), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, []);

  const colorSteps = Object.entries(generated).sort(([a], [b]) => {
    const order = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
    return order.indexOf(a) - order.indexOf(b);
  });

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-5 py-16 md:py-24">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-lg shadow-sm"
              style={{ backgroundColor: inputColor }}
            />
            <h1 className="text-3xl md:text-4xl font-semibold text-zinc-900 tracking-tight">
              Colour Generator
            </h1>
          </div>
          <p className="text-base text-zinc-500">
            Generate Tailwind CSS colour palettes from any base colour.
          </p>
        </div>

        {/* Controls */}
        <div className="mb-14">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-5">
              {/* Colour Picker */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  Base Colour
                </label>
                <div className="flex gap-2">
                  <div className="relative">
                    <input
                      type="color"
                      value={inputColor}
                      onChange={(e) => setInputColor(e.target.value)}
                      className="w-12 h-12 rounded-xl border border-zinc-200 cursor-pointer hover:border-zinc-300 transition-colors"
                    />
                    <Pipette className="w-3.5 h-3.5 text-white absolute bottom-1 right-1 pointer-events-none drop-shadow" />
                  </div>
                  <input
                    type="text"
                    value={inputColor}
                    onChange={(e) => setInputColor(e.target.value)}
                    className="flex-1 px-4 h-12 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all font-mono text-sm bg-zinc-50"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>

              {/* Colour Name */}
              <div className="md:w-48">
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  Name
                </label>
                <select
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  className="w-full h-12 px-4 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all bg-zinc-50 text-sm"
                >
                  <option value="custom">Custom</option>
                  {TAILWIND_COLOR_NAMES.map((name) => (
                    <option key={name} value={name}>
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Name */}
              {colorName === "custom" && (
                <div className="md:w-48">
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                    Variable prefix
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. brand"
                    className="w-full h-12 px-4 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all bg-zinc-50 text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Colour Palette */}
        <div className="mb-14">
          <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">
            Palette
          </h2>

          {/* Desktop: tall swatches */}
          <div className="hidden md:flex rounded-2xl overflow-hidden shadow-sm border border-zinc-200">
            {colorSteps.map(([key, color]) => {
              const isLight = tinycolor(color).isLight();
              const isBase = key === "500";
              const isCopied = copiedValue === `swatch-${key}`;

              return (
                <button
                  key={key}
                  onClick={() => handleCopy(color, `swatch-${key}`)}
                  className={cn(
                    "flex-1 h-28 flex flex-col justify-between p-3 cursor-pointer transition-all duration-150 hover:flex-[1.3] focus:outline-none relative group",
                    isBase && "flex-[1.3]"
                  )}
                  style={{ backgroundColor: color }}
                  title={`Click to copy ${color}`}
                >
                  <div className="flex items-center gap-1">
                    <span
                      className={cn(
                        "text-[11px] font-semibold",
                        isLight ? "text-zinc-900" : "text-white"
                      )}
                    >
                      {key}
                    </span>
                    {isBase && (
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          isLight ? "bg-zinc-900/30" : "bg-white/40"
                        )}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-[10px] font-mono",
                        isLight ? "text-zinc-600" : "text-zinc-300"
                      )}
                    >
                      {color}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] opacity-0 group-hover:opacity-100 transition-opacity",
                        isLight ? "text-zinc-500" : "text-zinc-400"
                      )}
                    >
                      {isCopied ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Mobile: grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:hidden gap-2">
            {colorSteps.map(([key, color]) => {
              const isLight = tinycolor(color).isLight();
              const isBase = key === "500";
              const isCopied = copiedValue === `swatch-${key}`;

              return (
                <button
                  key={key}
                  onClick={() => handleCopy(color, `swatch-${key}`)}
                  className={cn(
                    "aspect-[4/3] rounded-xl flex flex-col justify-between p-3 transition-all active:scale-95",
                    isBase && "ring-2 ring-zinc-900/20"
                  )}
                  style={{ backgroundColor: color }}
                >
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      isLight ? "text-zinc-900" : "text-white"
                    )}
                  >
                    {key}
                  </span>
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-[10px] font-mono",
                        isLight ? "text-zinc-600" : "text-zinc-300"
                      )}
                    >
                      {color}
                    </span>
                    {isCopied && (
                      <Check
                        className={cn(
                          "w-3 h-3",
                          isLight ? "text-zinc-600" : "text-zinc-300"
                        )}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-zinc-400 mt-3">
            Click any swatch to copy its hex value. The dot marks the 500 base step.
          </p>
        </div>

        {/* Code Outputs */}
        <div className="space-y-10">
          <CodeBlock
            title="Tailwind v4 — @theme"
            code={tailwindV4Snippet}
            copyId="v4"
            copiedValue={copiedValue}
            onCopy={handleCopy}
            badge="v4"
          />
          <CodeBlock
            title="CSS Variables"
            code={cssSnippet}
            copyId="css"
            copiedValue={copiedValue}
            onCopy={handleCopy}
          />
          <CodeBlock
            title="Tailwind v3 Config"
            code={tailwindConfigSnippet}
            copyId="config"
            copiedValue={copiedValue}
            onCopy={handleCopy}
          />
        </div>
      </div>
    </div>
  );
}

function CodeBlock({
  title,
  code,
  copyId,
  copiedValue,
  onCopy,
  badge,
}: {
  title: string;
  code: string;
  copyId: string;
  copiedValue: string | null;
  onCopy: (text: string, id: string) => void;
  badge?: string;
}) {
  const isCopied = copiedValue === copyId;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            {title}
          </h2>
          {badge && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-600 uppercase tracking-wide">
              {badge}
            </span>
          )}
        </div>
        <button
          onClick={() => onCopy(code, copyId)}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            isCopied
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
              : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900"
          )}
        >
          {isCopied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="bg-zinc-900 rounded-xl p-5 shadow-sm">
        <pre className="text-sm font-mono text-zinc-300 overflow-x-auto leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
