import type { VercelRequest, VercelResponse } from '@vercel/node'

// Helper for polling delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const token = process.env.HF_TOKEN

  if (!token) {
    return res.status(500).json({ 
      error: 'Hugging Face credentials (HF_TOKEN) are not configured on the server.' 
    })
  }

  try {
    let buffer: Buffer
    if (Buffer.isBuffer(req.body)) {
      buffer = req.body
    } else if (req.body && typeof req.body.image === 'string') {
      const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '')
      buffer = Buffer.from(base64Data, 'base64')
    } else {
      return res.status(400).json({ error: 'Missing or invalid image payload. Expected raw binary blob.' })
    }

    // Using TrOCR which is highly specialized for extracting printed text from images
    // Alternatively, we could use 'microsoft/Florence-2-large' if captioning was needed.
    const MODEL_ID = 'microsoft/trocr-large-printed'
    const inferenceUrl = `https://api-inference.huggingface.co/models/${MODEL_ID}`
    
    let attempts = 0
    let responseJson: any = null
    const MAX_ATTEMPTS = 15 // Max attempts for model cold starts

    while (attempts < MAX_ATTEMPTS) {
      attempts++
      const hfRes = await fetch(inferenceUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/octet-stream'
        },
        body: buffer
      })

      if (hfRes.status === 503) {
        // Model is loading (cold start)
        const errJson = await hfRes.json().catch(() => ({}))
        const estimatedTime = errJson.estimated_time || 5.0
        // Wait at most 8 seconds per loop
        const waitTime = Math.min(estimatedTime * 1000, 8000)
        console.log(`Hugging Face model is loading. Waiting ${waitTime}ms... (Attempt ${attempts})`)
        await delay(waitTime)
        continue
      }

      if (!hfRes.ok) {
        const errText = await hfRes.text()
        console.error('Hugging Face analyze error:', errText)
        return res.status(hfRes.status).json({ error: 'Failed to initiate analysis with Hugging Face.' })
      }

      responseJson = await hfRes.json()
      break
    }

    if (!responseJson) {
      return res.status(408).json({ error: 'Hugging Face model took too long to load. Please try again.' })
    }

    // Parse the generated text
    // HF typically returns [{ generated_text: "Result" }] for image-to-text
    let extractedText = ''
    if (Array.isArray(responseJson) && responseJson.length > 0) {
      extractedText = responseJson[0].generated_text || ''
    } else if (responseJson.generated_text) {
      extractedText = responseJson.generated_text
    } else if (typeof responseJson === 'string') {
      extractedText = responseJson
    }

    // Convert into lines for our existing frontend parsing logic
    const textLines = extractedText.split('\n').filter(l => l.trim() !== '')

    return res.status(200).json({ lines: textLines })

  } catch (err: any) {
    console.error('Hugging Face API Error:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}
