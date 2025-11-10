import { useState } from "react";
import tinycolor from "tinycolor2";

const TAILWIND_COLOR_NAMES = [
  "blue", "red", "green", "yellow", "indigo", "purple", "pink", "gray", "slate", "zinc", "neutral", "stone", "lime", "emerald", "teal", "cyan", "sky", "violet", "fuchsia", "rose", "orange", "amber"
];

function generateTailwindPalette(baseColor) {
  const base = tinycolor(baseColor);
  if (!base.isValid()) return {};

  const lchBase = base.toHsl();
  const baseL = lchBase.l;
  const baseH = lchBase.h;
  const baseS = lchBase.s;

  const steps = {
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
  const [generated, setGenerated] = useState(() => generateTailwindPalette("#3b82f6"));
  const [colorName, setColorName] = useState("custom");
  const [customName, setCustomName] = useState("");

  const handleChange = (e) => setInputColor(e.target.value);
  const handleSubmit = (e) => {
    e.preventDefault();
    const newPalette = generateTailwindPalette(inputColor);
    setGenerated(newPalette);
  };

  const varPrefix = colorName === "custom" ? customName || "custom" : colorName;
  const cssSnippet = `${Object.entries(generated)
    .map(([key, value]) => `  --color-${varPrefix}-${key}: ${value};`)
    .join("\n")}`;

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto space-y-6 bg-gray-50">
      <h1 className="text-3xl font-bold text-center text-gray-800">Tailwind CSS Color Generator</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:flex-row md:items-center">
        <input
          type="text"
          value={inputColor}
          onChange={handleChange}
          className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-400"
          placeholder="#3b82f6 or 'skyblue'"
        />
        <select
          value={colorName}
          onChange={(e) => setColorName(e.target.value)}
          className="p-2 border border-gray-300 rounded"
        >
          <option value="custom">custom</option>
          {TAILWIND_COLOR_NAMES.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        {colorName === "custom" && (
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="custom name"
            className="p-2 border border-gray-300 rounded"
          />
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Generate Palette
        </button>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(generated).map(([key, color]) => (
          <div
            key={key}
            className="rounded p-4 text-sm font-mono flex flex-col justify-between shadow"
            style={{ backgroundColor: color, color: tinycolor(color).isLight() ? '#000' : '#fff' }}
          >
            <span>{key}</span>
            <span>{color}</span>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">CSS Variables</h2>
        <div className="relative">
          <button
            onClick={() => navigator.clipboard.writeText(cssSnippet)}
            className="absolute right-2 top-2 text-sm bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
          >
            Copy
          </button>
          <pre className="bg-gray-200 p-4 rounded overflow-x-auto text-sm">
            <code>{cssSnippet}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
