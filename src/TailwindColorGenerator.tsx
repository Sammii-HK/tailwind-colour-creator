import { useState, useEffect, useCallback } from "react";
import { Copy, Check, Pipette } from "lucide-react";
import { cn } from "./lib/utils";

const TAILWIND_COLOR_NAMES = [
  "blue", "red", "green", "yellow", "indigo", "purple", "pink", "gray",
  "slate", "zinc", "neutral", "stone", "lime", "emerald", "teal", "cyan",
  "sky", "violet", "fuchsia", "rose", "orange", "amber",
];

// ── OKLCH colour science (zero dependencies, ported from gamut) ──────────────

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}
function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

function linearRgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  ];
}
function oklabToLinearRgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

interface Oklch { l: number; c: number; h: number }

function hexToOklch(hex: string): Oklch | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const r = srgbToLinear(parseInt(clean.slice(0, 2), 16) / 255);
  const g = srgbToLinear(parseInt(clean.slice(2, 4), 16) / 255);
  const b = srgbToLinear(parseInt(clean.slice(4, 6), 16) / 255);
  const [L, a, bOk] = linearRgbToOklab(r, g, b);
  const c = Math.sqrt(a * a + bOk * bOk);
  let h = (Math.atan2(bOk, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h };
}

function isInGamut(l: number, c: number, h: number): boolean {
  const rad = (h * Math.PI) / 180;
  const [lr, lg, lb] = oklabToLinearRgb(l, c * Math.cos(rad), c * Math.sin(rad));
  const eps = 0.001;
  return lr >= -eps && lr <= 1 + eps && lg >= -eps && lg <= 1 + eps && lb >= -eps && lb <= 1 + eps;
}

// Binary search on chroma to find the sRGB gamut boundary
function gamutClamp(l: number, c: number, h: number): [number, number, number] {
  if (isInGamut(l, c, h)) return [l, c, h];
  let lo = 0, hi = c;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (isInGamut(l, mid, h)) lo = mid; else hi = mid;
  }
  return [l, (lo + hi) / 2, h];
}

function oklchToHex(l: number, c: number, h: number): string {
  const rad = (h * Math.PI) / 180;
  const [lr, lg, lb] = oklabToLinearRgb(l, c * Math.cos(rad), c * Math.sin(rad));
  const r = Math.round(clamp01(linearToSrgb(lr)) * 255);
  const g = Math.round(clamp01(linearToSrgb(lg)) * 255);
  const b = Math.round(clamp01(linearToSrgb(lb)) * 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// ── Palette generation ───────────────────────────────────────────────────────
//
// lFactor: interpolates L from the base colour towards white (positive) or
//          black (negative). Calibrated from Tailwind's actual OKLCH palettes.
// cScale:  chroma multiplier. Lights are strongly desaturated; darks taper off.
//          This is the main quality improvement over the HSL approach.

const STEP_CONFIG = [
  { step: "50",  lFactor:  0.935, cScale: 0.07 },
  { step: "100", lFactor:  0.863, cScale: 0.20 },
  { step: "200", lFactor:  0.715, cScale: 0.46 },
  { step: "300", lFactor:  0.531, cScale: 0.77 },
  { step: "400", lFactor:  0.256, cScale: 0.97 },
  { step: "500", lFactor:  0,     cScale: 1.00 },
  { step: "600", lFactor: -0.130, cScale: 0.81 },
  { step: "700", lFactor: -0.268, cScale: 0.65 },
  { step: "800", lFactor: -0.402, cScale: 0.46 },
  { step: "900", lFactor: -0.501, cScale: 0.35 },
  { step: "950", lFactor: -0.668, cScale: 0.21 },
];

interface ColorPalette { [key: string]: string }

function generateTailwindPalette(baseHex: string): ColorPalette {
  const base = hexToOklch(baseHex);
  if (!base) return {};

  return Object.fromEntries(
    STEP_CONFIG.map(({ step, lFactor, cScale }) => {
      // Relative L interpolation — 500 stays the exact input colour
      const l = clamp01(
        lFactor >= 0
          ? base.l + lFactor * (1.0 - base.l)
          : base.l + lFactor * base.l
      );
      const c = Math.max(0, base.c * cScale);
      const [cl, cc, ch] = gamutClamp(l, c, base.h);
      return [step, oklchToHex(cl, cc, ch)];
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
