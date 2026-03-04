import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const PROCESSING_DIR = path.resolve(__dirname, '../processing');
const WAV_PATH = path.join(PROCESSING_DIR, 'current.wav');

// Ensure processing/ folder exists
if (!fs.existsSync(PROCESSING_DIR)) {
  fs.mkdirSync(PROCESSING_DIR, { recursive: true });
}

/**
 * Converts any audio buffer to 16kHz mono PCM WAV using ffmpeg.
 * ffmpeg writes directly to a fixed file (processing/current.wav),
 * overwriting any previous file — no manual buffering or cleanup needed.
 */
export function convertToWav(inputBuffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-i', 'pipe:0',         // input from stdin
      '-f', 'wav',            // output format
      '-ar', '16000',         // 16kHz sample rate
      '-ac', '1',             // mono
      '-acodec', 'pcm_s16le', // 16-bit PCM
      '-y',                   // overwrite output file without asking
      WAV_PATH,               // write directly to fixed path
    ], { stdio: ['pipe', 'ignore', 'pipe'] }); // ignore stdout, capture stderr for errors

    const errChunks: Buffer[] = [];
    ffmpeg.stderr.on('data', (chunk: Buffer) => errChunks.push(chunk));

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        const errMsg = Buffer.concat(errChunks).toString();
        return reject(new Error(`ffmpeg exited with code ${code}: ${errMsg}`));
      }
      resolve(WAV_PATH);
    });

    ffmpeg.on('error', (err) => reject(new Error(`Failed to start ffmpeg: ${err.message}`)));

    ffmpeg.stdin.write(inputBuffer);
    ffmpeg.stdin.end();
  });
}

