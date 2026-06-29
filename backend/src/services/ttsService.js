const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const axios = require('axios');
const prisma = require('../config/database');

// Configure S3 client for Cloudflare R2
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY
  }
});

/**
 * Gets cached audio URL or generates a new one using Google Text-to-Speech API
 * and uploads it to Cloudflare R2 storage.
 * 
 * @param {string} wordId - The unique database ID of the word
 * @param {string} wordText - The word text to synthesize
 * @returns {Promise<string>} The public audio URL
 */
async function getOrGenerateAudio(wordId, wordText) {
  // 1. Check if word already has an audioUrl in the database
  const word = await prisma.word.findUnique({
    where: { id: wordId }
  });

  if (!word) {
    throw new Error(`Word with ID ${wordId} not found`);
  }

  // Cache hit
  if (word.audioUrl) {
    return word.audioUrl;
  }

  // 2. Cache miss: Request TTS from Google API
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  const ttsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  const response = await axios.post(ttsUrl, {
    input: { ssml: `<speak><break time="600ms"/>${wordText}</speak>` },
    voice: { languageCode: 'en-GB', name: 'en-GB-Neural2-F' },
    audioConfig: { 
      audioEncoding: 'MP3',
      speakingRate: 0.85
    }
  });

  const audioContent = response.data.audioContent;
  if (!audioContent) {
    throw new Error('Google TTS API did not return audioContent');
  }

  // 3. Convert base64 audioContent response to a Buffer
  const buffer = Buffer.from(audioContent, 'base64');
  const filename = `${wordId}.mp3`;
  const bucketName = process.env.R2_BUCKET;

  // 4. Upload the buffer to R2
  await s3.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: filename,
    Body: buffer,
    ContentType: 'audio/mpeg'
  }));

  // 5. Build public URL from R2_ENDPOINT + R2_BUCKET + filename
  const cleanEndpoint = process.env.R2_ENDPOINT.replace(/\/$/, '');
  const publicUrl = `${cleanEndpoint}/${bucketName}/${filename}`;

  // 6. Save the URL to the word record in the database
  await prisma.word.update({
    where: { id: wordId },
    data: { audioUrl: publicUrl }
  });

  return publicUrl;
}

module.exports = {
  getOrGenerateAudio
};
