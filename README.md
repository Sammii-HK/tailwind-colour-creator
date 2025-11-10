# Tailwind Color Generator

A beautiful, production-ready tool for generating Tailwind CSS color palettes. Create custom color scales with CSS variables and Tailwind config snippets.

## Features

- 🎨 Generate beautiful color palettes from any base color
- 📋 Copy CSS variables or Tailwind config snippets with one click
- 🎯 Click on any color swatch to copy its hex value
- 📱 Fully responsive design
- ⚡ Built with React, TypeScript, and Tailwind CSS
- 🚀 Ready for production deployment

## Getting Started

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## Deployment to Vercel

This project is configured for easy deployment on Vercel:

1. **Push your code to GitHub** (or GitLab/Bitbucket)

2. **Import your repository on Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your Git repository

3. **Vercel will automatically detect the settings**:
   - Framework: Vite
   - Build Command: `pnpm build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`

4. **Deploy!** Vercel will build and deploy your app automatically.

### Manual Deployment

You can also deploy using the Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## Usage

1. Enter a base color (hex code or color name like "skyblue")
2. Select a color name from the dropdown or use a custom name
3. View your generated palette
4. Copy CSS variables or Tailwind config snippets as needed
5. Click on any color swatch to copy its hex value

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS v4** - Styling
- **tinycolor2** - Color manipulation

## License

MIT
