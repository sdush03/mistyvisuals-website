const fs = require('fs');
const path = './app/admin/stories/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\{\/\* Photo upload \*\/\}([\s\S]*?)<\/div>\n    <\/div>\n  \)\n\}/;

const newGalleryRender = `
      {/* Photo upload per tab */}
      {['All', ...tabsString.split(',').map(t=>t.trim()).filter(Boolean)].map(tab => {
        const isAll = tab === 'All';
        const tabPhotos = isAll ? photos.filter(p => !p.tab_name || p.tab_name === 'All') : photos.filter(p => p.tab_name === tab);
        return (
          <div key={tab} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 400, marginBottom: '0.2rem' }}>{isAll ? 'Gallery Photos (Default)' : \`\${tab} Photos\`}</h2>
                <p style={{ fontSize: '0.75rem', color: '#aaa' }}>{tabPhotos.length} photos · Drag to reorder · Click star to set cover</p>
              </div>
              <button onClick={() => {
                const el = document.getElementById(\`file-\${tab}\`);
                if (el) el.click();
              }} style={{
                background: '#1a1512', color: '#fff', border: 'none', borderRadius: '8px',
                padding: '0.625rem 1.25rem', fontSize: '0.8125rem', cursor: 'pointer',
              }}>
                + Upload to {tab}
              </button>
              <input id={\`file-\${tab}\`} type="file" accept="image/*" multiple style={{ display: 'none' }}
                onChange={e => e.target.files && uploadPhotos(Array.from(e.target.files), isAll ? null : tab)} />
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault(); setDragOver(false)
                const files = Array.from(e.dataTransfer.files).filter((f: any) => f.type.startsWith('image/'))
                if (files.length) uploadPhotos(files, isAll ? null : tab)
              }}
              style={{
                border: \`2px dashed \${dragOver ? '#1a1512' : '#e0e0e0'}\`,
                borderRadius: '8px', padding: '1.25rem', textAlign: 'center',
                marginBottom: '1.25rem', background: dragOver ? '#f7f5f2' : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              {uploading ? (
                <div>
                  <div style={{ height: '4px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '0.5rem', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#1a1512', width: \`\${uploadProgress}%\`, transition: 'width 0.2s' }} />
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#555' }}>Uploading & optimizing {uploadProgress}%…</p>
                </div>
              ) : (
                <p style={{ fontSize: '0.8125rem', color: '#bbb' }}>Drop photos here to add them to {tab}</p>
              )}
            </div>

            {tabPhotos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                {tabPhotos.map(photo => (
                  <div key={photo.id}
                    draggable
                    onDragStart={() => onDragStart(photo.id)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => onDrop(photo.id)}
                    style={{
                      position: 'relative', aspectRatio: '1', borderRadius: '6px', overflow: 'hidden',
                      cursor: 'grab', border: draggingId === photo.id ? '2px solid #1a1512' : '2px solid transparent',
                      background: '#f0ede8',
                    }}
                  >
                    <img src={photo.file_url_thumb || photo.file_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {photo.is_cover && (
                      <div style={{ position: 'absolute', top: '5px', left: '5px', background: '#b8965a', borderRadius: '4px', padding: '2px 6px', fontSize: '0.5625rem', color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Cover
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(10,8,6,0.6)', padding: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
                      <button onClick={() => setCover(photo.id)} title="Set as cover" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', lineHeight: 1 }}>
                        {photo.is_cover ? '⭐' : '☆'}
                      </button>
                      <button onClick={() => deletePhoto(photo.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fc8181', fontSize: '0.75rem' }}>
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  )
}
`;

content = content.replace(regex, newGalleryRender);
fs.writeFileSync(path, content);
