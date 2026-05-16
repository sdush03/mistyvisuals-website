/**
 * Client-side canvas image compressor.
 * Resizes to maxWidth x maxHeight (maintaining aspect ratio) and encodes as JPEG at given quality.
 * Returns a File object ready to upload.
 */
export async function compressImage(
  file: File,
  { maxWidth = 2560, maxHeight = 1600, quality = 0.82 } = {}
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      // Scale down preserving aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const scale = Math.min(maxWidth / width, maxHeight / height)
        width  = Math.round(width  * scale)
        height = Math.round(height * scale)
      }

      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        blob => {
          if (!blob) return reject(new Error('Compression failed'))
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
          resolve(compressed)
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => reject(new Error('Image load failed'))
    img.src = url
  })
}
