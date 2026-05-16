const fs = require('fs');
const path = './app/admin/stories/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add tabs string state
content = content.replace(
  "const [catDropdownOpen, setCatDropdownOpen] = useState(false)",
  "const [catDropdownOpen, setCatDropdownOpen] = useState(false)\n  const [tabsString, setTabsString] = useState('')"
);

// Init tabsString
content = content.replace(
  "setPhotos((storyData.photos || []).sort((a: Photo, b: Photo) => a.display_order - b.display_order))",
  "setPhotos((storyData.photos || []).sort((a: Photo, b: Photo) => a.display_order - b.display_order))\n      setTabsString((storyData.tabs || []).join(', '))"
);

// Send tabs on save
content = content.replace(
  "is_featured: story.is_featured,",
  "is_featured: story.is_featured,\n        tabs: tabsString.split(',').map(t=>t.trim()).filter(Boolean),"
);

// Add tabName to uploadPhotos
content = content.replace(
  "const uploadPhotos = async (files: File[]) => {",
  "const uploadPhotos = async (files: File[], tabName: string | null = null) => {"
);
content = content.replace(
  "xhr.open('POST', `${API}/api/website/stories/${id}/photos`)",
  "xhr.open('POST', `${API}/api/website/stories/${id}/photos${tabName ? `?tab=${encodeURIComponent(tabName)}` : ''}`)"
);

// Add tabs input UI
const tabsUI = `
          {/* Tabs Input */}
          <div>
            <label style={label}>Event Tabs (Comma separated)</label>
            <input type="text" style={input} placeholder="e.g. Haldi, Wedding" value={tabsString}
              onChange={e => setTabsString(e.target.value)} />
            <p style={{ fontSize: '0.7rem', color: '#888', marginTop: '0.3rem' }}>Creates separate galleries for each event.</p>
          </div>
`;
content = content.replace("{/* Custom Category Multi-Select Dropdown */}", tabsUI + "\n          {/* Custom Category Multi-Select Dropdown */}");

fs.writeFileSync(path, content);
