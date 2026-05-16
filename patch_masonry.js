const fs = require('fs');
const path = './components/StoryGallery.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add cols state and effect
content = content.replace(
  "const [lb, setLb] = useState<number | null>(null)",
  "const [lb, setLb] = useState<number | null>(null)\n  const [cols, setCols] = useState(3)\n\n  useEffect(() => {\n    const updateCols = () => {\n      if (window.innerWidth <= 640) setCols(1)\n      else if (window.innerWidth <= 1024) setCols(2)\n      else setCols(3)\n    }\n    updateCols()\n    window.addEventListener('resize', updateCols)\n    return () => window.removeEventListener('resize', updateCols)\n  }, [])"
);

// Add columnPhotos logic
const regex = /\{\/\* ── Masonry columns ── \*\/\}([\s\S]*?)<\/div>\n\n      \{\/\* ── Lightbox ── \*\/\}/;

const newMasonry = `
      {/* ── Masonry columns ── */}
      <div
        className="story-masonry"
        style={{
          display: 'flex',
          gap: '16px',
          padding: '16px var(--page-x) 32px',
          background: '#fff',
        }}
      >
        {Array.from({ length: cols }).map((_, colIdx) => {
          const colPhotos = filteredPhotos.filter((_, i) => i % cols === colIdx);
          return (
            <div key={colIdx} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {colPhotos.map((photo) => {
                const globalIdx = filteredPhotos.indexOf(photo);
                return (
                  <div
                    key={photo.id}
                    onClick={() => setLb(globalIdx)}
                    style={{
                      cursor: 'zoom-in',
                      overflow: 'hidden',
                      lineHeight: 0,
                    }}
                    className="gallery-item"
                  >
                    <img
                      src={photo.file_url_thumb || photo.file_url}
                      srcSet={\`\${photo.file_url_thumb || photo.file_url} 600w, \${photo.file_url} 1920w\`}
                      sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw"
                      alt=""
                      loading={globalIdx < 4 ? 'eager' : 'lazy'}
                      decoding="async"
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        background: photo.blur_data_url ? \`url(\${photo.blur_data_url}) no-repeat center/cover\` : 'var(--linen-dark)',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ── Lightbox ── */}`;

content = content.replace(regex, newMasonry.trim());

fs.writeFileSync(path, content);
