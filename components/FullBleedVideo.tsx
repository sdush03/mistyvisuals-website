'use client'

interface Props {
  videoUrl?: string
  mediaType?: string
}

export default function FullBleedVideo({ videoUrl, mediaType }: Props) {
  const url = videoUrl
  if (!url) return null

  const isVideo = mediaType === 'video' || (!mediaType && /\.(mp4|webm|ogg|mov)$/i.test(url))

  return (
    <section style={{ 
      width: '100%', 
      height: 'clamp(500px, 80vh, 900px)',
      overflow: 'hidden', 
      position: 'relative',
      background: '#1c1a18'
    }}>
      {isVideo ? (
        <video
          src={url}
          autoPlay
          muted
          loop
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: 0.9,
          }}
        />
      ) : (
        <img
          src={url}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: 0.9,
          }}
        />
      )}
    </section>
  )
}
