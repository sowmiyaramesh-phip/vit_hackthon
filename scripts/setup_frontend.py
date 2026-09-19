from pathlib import Path

f_dir = Path("frontend")
f_dir.mkdir(exist_ok=True)
src_dir = f_dir / "src"
src_dir.mkdir(exist_ok=True)

# 1. vite.config.ts
(f_dir / "vite.config.ts").write_text("""import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      }
    }
  }
});
""", encoding="utf-8")

# 2. tailwind.config.js
(f_dir / "tailwind.config.js").write_text("""/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        clinical: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        }
      }
    },
  },
  plugins: [],
}
""", encoding="utf-8")

# 3. postcss.config.js
(f_dir / "postcss.config.js").write_text("""export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
""", encoding="utf-8")

# 4. tsconfig.json
(f_dir / "tsconfig.json").write_text("""{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
""", encoding="utf-8")

# 5. index.html
(f_dir / "index.html").write_text("""<!doctype html>
<html lang="en" class="h-full bg-slate-900 text-slate-100">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ATLAS + MONITOR — Clinical Trial Intelligence Platform</title>
  </head>
  <body class="h-full font-sans antialiased bg-slate-950 text-slate-100 overflow-x-hidden">
    <div id="root" class="h-full"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
""", encoding="utf-8")

# 6. index.css
(src_dir / "index.css").write_text("""@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background-color: #020617;
  color: #f8fafc;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #0f172a;
}
::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #475569;
}
""", encoding="utf-8")

print("Frontend configuration generated successfully!")
