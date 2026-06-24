const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

// Load .env
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const videoPath = process.argv[2];
if (!videoPath) { console.error('Usage: node transcribe.js <video-path>'); process.exit(1); }

const audioPath = path.join(__dirname, 'temp_audio.mp3');
const outPath = path.join(__dirname, 'transcript.json');

async function main() {
  console.log('Extracting audio...');
  execSync(`ffmpeg -y -i "${videoPath}" -vn -acodec mp3 -ar 16000 -ac 1 -q:a 4 "${audioPath}"`, { stdio: 'pipe' });
  const size = (fs.statSync(audioPath).size / 1024 / 1024).toFixed(1);
  console.log(`Audio extracted: ${size} MB`);

  console.log('Transcribing with Whisper...');
  const transcript = await client.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['word', 'segment'],
  });

  fs.writeFileSync(outPath, JSON.stringify(transcript, null, 2));
  fs.unlinkSync(audioPath);

  console.log('\n=== TRANSCRIPT ===\n');
  console.log(transcript.text);
  console.log(`\nSaved to: ${outPath}`);
  console.log(`Duration: ${transcript.duration?.toFixed(1)}s`);
  console.log(`Words: ${transcript.words?.length}`);
}

main().catch(console.error);
