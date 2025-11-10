import { useState, useEffect } from "react";
import tinycolor from "tinycolor2";
import { Copy, Check } from "lucide-react";
import { Button } from "./components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { cn } from "./lib/utils";

const TAILWIND_COLOR_NAMES = [
  "blue", "red", "green", "yellow", "indigo", "purple", "pink", "gray", "slate", "zinc", "neutral", "stone", "lime", "emerald", "teal", "cyan", "sky", "violet", "fuchsia", "rose", "orange", "amber"
];

interface ColorPalette {
  [key: string]: string;
}

function generateTailwindPalette(baseColor: string): ColorPalette {
  const base = tinycolor(baseColor);
  if (!base.isValid()) return {};

  const lchBase = base.toHsl();
  const baseH = lchBase.h;
  const baseS = lchBase.s;

  const steps: { [key: string]: number } = {
    50: 0.97,
    100: 0.92,
    200: 0.84,
    300: 0.74,
    400: 0.6,
    500: 0.5,
    600: 0.4,
    700: 0.3,
    800: 0.2,
    900: 0.12,
    950: 0.06,
  };

  return Object.fromEntries(
    Object.entries(steps).map(([step, lVal]) => {
      const color = tinycolor({
        h: baseH,
        s: baseS,
        l: lVal,
      });
      return [step, color.toHexString()];
    })
  );
}

export default function TailwindColorGenerator() {
  const [inputColor, setInputColor] = useState("#3b82f6");
  const [generated, setGenerated] = useState<ColorPalette>(() => generateTailwindPalette("#3b82f6"));
  const [colorName, setColorName] = useState("custom");
  const [customName, setCustomName] = useState("");
  const [copiedType, setCopiedType] = useState<"css" | "config" | null>(null);

  useEffect(() => {
    const newPalette = generateTailwindPalette(inputColor);
    setGenerated(newPalette);
  }, [inputColor]);

  const varPrefix = colorName === "custom" ? customName || "custom" : colorName;
  const cssSnippet = `:root {\n${Object.entries(generated)
    .map(([key, value]) => `  --color-${varPrefix}-${key}: ${value};`)
    .join("\n")}\n}`;

  const tailwindConfigSnippet = `${varPrefix}: {\n${Object.entries(generated)
    .map(([key]) => `    ${key}: 'var(--color-${varPrefix}-${key})',`)
    .join("\n")}\n  }`;

  const handleCopy = async (text: string, type: "css" | "config") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const colorSteps = Object.entries(generated).sort(([a], [b]) => {
    const order = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
    return order.indexOf(a) - order.indexOf(b);
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <div className="mb-16 md:mb-20">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-3 tracking-tight">
            Tailwind Color Generator
          </h1>
          <p className="text-lg md:text-xl text-gray-500 font-light">
            Generate beautiful color palettes for your Tailwind CSS projects
          </p>
        </div>

        {/* Controls */}
        <div className="mb-16 md:mb-20 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Color Picker */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                Base Color
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={inputColor}
                  onChange={(e) => setInputColor(e.target.value)}
                  className="w-12 h-12 rounded border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors"
                />
                <input
                  type="text"
                  value={inputColor}
                  onChange={(e) => setInputColor(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all font-mono text-sm bg-white"
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            {/* Color Name */}
            <div className="md:w-48">
              <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                Color Name
              </label>
              <Select value={colorName} onValueChange={setColorName}>
                <SelectTrigger className="w-full h-12 bg-white border-gray-200">
                  <SelectValue placeholder="Select color name" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="custom">Custom</SelectItem>
                  {TAILWIND_COLOR_NAMES.map((name) => (
                    <SelectItem key={name} value={name} className="bg-white hover:bg-gray-50">
                      <span className="capitalize">{name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Name */}
            {colorName === "custom" && (
              <div className="md:w-48">
                <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                  Custom Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g., brand"
                  className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-all bg-white"
                />
              </div>
            )}
          </div>
        </div>

        {/* Color Palette */}
        <div className="mb-16 md:mb-20">
          <h2 className="text-xl md:text-2xl font-light text-gray-900 mb-8">Color Palette</h2>
          
          {/* Desktop: Single Row - using md breakpoint instead of lg */}
          <div className="hidden md:flex gap-px overflow-hidden rounded-lg">
            {colorSteps.map(([key, color]) => {
              const isLight = tinycolor(color).isLight();
              
              return (
                <div
                  key={key}
                  className="flex-1 aspect-[2/3] flex flex-col justify-between p-4 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: color }}
                >
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isLight ? "text-gray-900" : "text-white"
                    )}
                  >
                    {key}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-mono",
                      isLight ? "text-gray-700" : "text-gray-200"
                    )}
                  >
                    {color}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Mobile: Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:hidden gap-2">
            {colorSteps.map(([key, color]) => {
              const isLight = tinycolor(color).isLight();
              
              return (
                <div
                  key={key}
                  className="aspect-square rounded-lg flex flex-col justify-between p-3"
                  style={{ backgroundColor: color }}
                >
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isLight ? "text-gray-900" : "text-white"
                    )}
                  >
                    {key}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-mono",
                      isLight ? "text-gray-700" : "text-gray-200"
                    )}
                  >
                    {color}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CSS Variables */}
        <div className="mb-12 md:mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl md:text-2xl font-light text-gray-900">CSS Variables</h2>
            <Button
              onClick={() => handleCopy(cssSnippet, "css")}
              variant="outline"
              size="default"
              className="w-full sm:w-auto"
            >
              {copiedType === "css" ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy CSS
                </>
              )}
            </Button>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <pre className="text-sm font-mono text-gray-800 overflow-x-auto">
              <code>{cssSnippet}</code>
            </pre>
          </div>
        </div>

        {/* Tailwind Config */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl md:text-2xl font-light text-gray-900">Tailwind Config</h2>
            <Button
              onClick={() => handleCopy(tailwindConfigSnippet, "config")}
              variant="outline"
              size="default"
              className="w-full sm:w-auto"
            >
              {copiedType === "config" ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Config
                </>
              )}
            </Button>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <pre className="text-sm font-mono text-gray-800 overflow-x-auto">
              <code>{tailwindConfigSnippet}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
