'use client'

interface Props {
  videoUrl?: string
  posterUrl?: string
}

export default function FullBleedVideo({ videoUrl, posterUrl }: Props) {
  // A clean, cinematic placeholder if the user hasn't uploaded one yet
  const url = videoUrl || 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'

  return (
    <section style={{ 
      width: '100%', 
      height: 'clamp(500px, 80vh, 900px)', // Tall but not quite full screen
      overflow: 'hidden', 
      position: 'relative',
      background: '#1c1a18'
    }}>
      <video
        src={url}
        poster={posterUrl}
        autoPlay
        muted
        loop
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: 0.9, // Slight dark cinematic mood
        }}
      />
    </section>
  )
}
