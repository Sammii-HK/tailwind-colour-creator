import { useState, useEffect } from "react";
import tinycolor from "tinycolor2";

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
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  useEffect(() => {
    const newPalette = generateTailwindPalette(inputColor);
    setGenerated(newPalette);
  }, [inputColor]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputColor(e.target.value);
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputColor(e.target.value);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
            Tailwind Color Generator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Generate beautiful color palettes for your Tailwind CSS projects
          </p>
        </div>

        {/* Color Input Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-8 border border-gray-100">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1 space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Base Color
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-shrink-0">
                    <input
                      type="color"
                      value={inputColor}
                      onChange={handleColorChange}
                      className="w-16 h-12 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-gray-300 transition-colors"
                    />
                  </div>
                  <input
                    type="text"
                    value={inputColor}
                    onChange={handleTextInputChange}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm"
                    placeholder="#3b82f6 or 'skyblue'"
                  />
                </div>
              </div>

              <div className="w-full sm:w-48 space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Color Name
                </label>
                <select
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="custom">Custom</option>
                  {TAILWIND_COLOR_NAMES.map((name) => (
                    <option key={name} value={name} className="capitalize">
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {colorName === "custom" && (
                <div className="w-full sm:w-48 space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Custom Name
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g., brand"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Color Palette Grid */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Color Palette</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-3">
            {colorSteps.map(([key, color]) => {
              const isLight = tinycolor(color).isLight();
              const isHovered = hoveredColor === key;
              
              return (
                <div
                  key={key}
                  className="group relative rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105"
                  style={{ backgroundColor: color }}
                  onMouseEnter={() => setHoveredColor(key)}
                  onMouseLeave={() => setHoveredColor(null)}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(color);
                    } catch (err) {
                      console.error("Failed to copy:", err);
                    }
                  }}
                >
                  <div className="aspect-square flex flex-col justify-between p-4">
                    <span
                      className={`text-xs font-semibold transition-opacity ${
                        isLight ? "text-gray-900" : "text-white"
                      } ${isHovered ? "opacity-100" : "opacity-70"}`}
                    >
                      {key}
                    </span>
                    <span
                      className={`text-xs font-mono transition-opacity ${
                        isLight ? "text-gray-700" : "text-gray-200"
                      } ${isHovered ? "opacity-100" : "opacity-60"}`}
                    >
                      {color}
                    </span>
                  </div>
                  {isHovered && (
                    <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center">
                      <span className={`text-xs font-medium ${isLight ? "text-gray-900" : "text-white"}`}>
                        Click to copy
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CSS Variables Output */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">CSS Variables</h2>
            <button
              onClick={() => handleCopy(cssSnippet, "css")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              {copiedType === "css" ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy CSS
                </>
              )}
            </button>
          </div>
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-4 sm:p-6 rounded-lg overflow-x-auto text-sm font-mono">
              <code>{cssSnippet}</code>
            </pre>
          </div>
        </div>

        {/* Tailwind Config Output */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Tailwind Config</h2>
            <button
              onClick={() => handleCopy(tailwindConfigSnippet, "config")}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              {copiedType === "config" ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Config
                </>
              )}
            </button>
          </div>
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-4 sm:p-6 rounded-lg overflow-x-auto text-sm font-mono">
              <code>{tailwindConfigSnippet}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-600 text-sm">
          <p>Built with React, TypeScript, and Tailwind CSS</p>
        </div>
      </div>
    </div>
  );
}
