const fs = require('fs');
const path = require('path');

// Archivos que necesitan corrección
const filesToFix = [
  'app/admin/products/new/page.tsx',
  'app/productos/epoxicos/page.tsx',
  'app/productos/kits/page.tsx',
  'app/productos/epoxicos/[id]/page.tsx',
  'app/productos/kits/[id]/page.tsx',
  'app/sitemap.ts',
  'app/admin/products/edit/[category]/[id]/page.tsx',
  'app/admin/products/page.tsx'
];

function fixFetchUrls() {
  filesToFix.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);

    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    try {
      let content = fs.readFileSync(fullPath, 'utf8');

      // Reemplazar URLs hard-coded
      const patterns = [
        {
          from: /fetch\(`http:\/\/localhost:5000\/api/g,
          to: 'fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}'
        },
        {
          from: /await fetch\(`http:\/\/localhost:5000\/api/g,
          to: 'await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}'
        },
        {
          from: /const response = await fetch\(`http:\/\/localhost:5000\/api/g,
          to: 'const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"\n    const response = await fetch(`${baseUrl}'
        }
      ];

      let modified = false;
      patterns.forEach(pattern => {
        if (pattern.from.test(content)) {
          content = content.replace(pattern.from, pattern.to);
          modified = true;
        }
      });

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Fixed: ${filePath}`);
      } else {
        console.log(`⏭️  No changes needed: ${filePath}`);
      }

    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error.message);
    }
  });
}

console.log('🔧 Fixing fetch URLs...');
fixFetchUrls();
console.log('✅ Done!');