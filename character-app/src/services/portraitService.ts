const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      reject(new Error('identity.portraitErrorType'))
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error('identity.portraitErrorSize'))
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result !== 'string') {
        reject(new Error('identity.portraitErrorType'))
        return
      }
      resolve(result)
    }
    reader.onerror = () => reject(new Error('identity.portraitErrorType'))
    reader.readAsDataURL(file)
  })
}
