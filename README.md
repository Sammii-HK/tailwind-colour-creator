# Tailwind Color Generator

A color palette generator for Tailwind CSS projects. Built with React, TypeScript, and accessible UI components.

## Overview

Web application for generating Tailwind CSS color palettes from a base color. Converts input colors to HSL color space and generates 11-step scales (50-950) matching Tailwind's color system. Outputs CSS variables and Tailwind config snippets.

## Features

- **Real-time Color Generation**: Instant palette generation using HSL color space calculations
- **Multiple Export Formats**: CSS variables and Tailwind config snippets
- **Accessible UI Components**: Built with Radix UI primitives for keyboard navigation and screen reader support
- **Responsive Design**: Mobile-first approach with breakpoint-optimized layouts
- **Type-Safe**: Full TypeScript coverage with strict type checking
- **Performance Optimized**: Efficient re-renders and optimized build output

## Technology Stack

- **React 19** - UI framework with concurrent rendering
- **TypeScript 5.8** - Type safety with strict configuration
- **Vite 7** - Build tooling and HMR
- **Tailwind CSS v4** - Utility-first CSS with PostCSS integration
- **Radix UI** - Accessible component primitives
- **tinycolor2** - Color manipulation library

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- pnpm 8+ (or npm/yarn)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd tailwind-colour-creator

# Install dependencies
pnpm install
```

### Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run linter
pnpm lint
```

## Color Algorithm

The palette generation uses HSL (Hue, Saturation, Lightness) color space for perceptually uniform color scales:

1. Converts input color to HSL using tinycolor2
2. Preserves hue and saturation values
3. Generates 11 lightness steps (50-950) matching Tailwind's scale:
   - 50: 0.97 lightness
   - 100: 0.92 lightness
   - 200: 0.84 lightness
   - 300: 0.74 lightness
   - 400: 0.6 lightness
   - 500: 0.5 lightness
   - 600: 0.4 lightness
   - 700: 0.3 lightness
   - 800: 0.2 lightness
   - 900: 0.12 lightness
   - 950: 0.06 lightness
4. Converts back to hex for output

This ensures consistent visual weight across the palette while maintaining color harmony.
