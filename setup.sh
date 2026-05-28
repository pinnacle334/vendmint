#!/bin/bash

echo "🚀 Setting up your Next.js starter structure..."

# ------------------------
# APP ROUTES
# ------------------------
mkdir -p app/about
mkdir -p app/build
mkdir -p app/contact

touch app/about/page.tsx
touch app/build/page.tsx
touch app/contact/page.tsx

# ------------------------
# COMPONENTS (UI LAYER)
# ------------------------
mkdir -p components/ui
mkdir -p components/layout
mkdir -p components/sections

# ------------------------
# LOGIC LAYER
# ------------------------
mkdir -p lib
touch lib/utils.ts
touch lib/constants.ts

# ------------------------
# BEHAVIOR LAYER
# ------------------------
mkdir -p hooks
touch hooks/useToggle.ts
touch hooks/useScroll.ts

# ------------------------
# PUBLIC ASSETS
# ------------------------
mkdir -p public/images
mkdir -p public/icons

# ------------------------
# TYPES
# ------------------------
mkdir -p types
touch types/index.ts

# ------------------------
# GLOBALS.CSS CONTENT
# ------------------------
cat <<EOF > app/globals.css
@import "tailwindcss";
@plugin "daisyui";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --bgColor: #F9FAFB;
  --primary: #E50914;
}

.dark {
  --bgColor: #171717;
  --primary: #E50914;
}
EOF

# ------------------------
# LAYOUT.TSX CONTENT
# ------------------------
cat <<EOF > app/layout.tsx
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    );
}
EOF

# ------------------------
# PAGE.TSX CONTENT
# ------------------------
cat <<EOF > app/page.tsx
const Page = () => {
  return (
    <div>
        <h1 className="font-bold text-3xl text-center text-blue-600">Welcome!</h1>
        <p className="text-center font-large">Start building now and make money</p>
    </div>
  )
}

export default Page
EOF

echo "✅ Next.js starter structure created successfully!"