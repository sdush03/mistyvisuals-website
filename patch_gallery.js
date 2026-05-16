const fs = require('fs');
const path = './components/StoryGallery.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update interface
content = content.replace("interface Props { photos: StoryPhoto[] }", "interface Props { photos: StoryPhoto[], tabs?: string[] | null }");

// Update signature
content = content.replace("export default function StoryGallery({ photos }: Props) {", "export default function StoryGallery({ photos, tabs }: Props) {\n  const [activeTab, setActiveTab] = useState('All')");

// Filter photos
content = content.replace("if (!photos.length) return null", "if (!photos.length) return null\n\n  const filteredPhotos = activeTab === 'All' ? photos : photos.filter(p => p.tab_name === activeTab)");

// Update photos mapping
content = content.replace(/photos\.map\(\(p, i\)/g, "filteredPhotos.map((p, i)");
content = content.replace(/photos\.length/g, "filteredPhotos.length");

// Add Tabs UI
const tabsUI = `
      {tabs && tabs.length > 0 && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '2rem', padding: '1rem 0 3rem 0', flexWrap: 'wrap',
          background: '#fff', borderBottom: '1px solid #f0f0f0', marginBottom: '3px'
        }}>
          {['All', ...tabs].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: '0.6875rem',
                letterSpacing: '0.15em', textTransform: 'uppercase',
                color: activeTab === tab ? '#000' : '#888',
                paddingBottom: '0.25rem',
                borderBottom: activeTab === tab ? '1px solid #000' : '1px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      )}
`;

content = content.replace("{/* ── Masonry columns ── */}", tabsUI + "\n      {/* ── Masonry columns ── */}");

fs.writeFileSync(path, content);
