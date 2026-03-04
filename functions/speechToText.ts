import { Request, Response } from 'express';
import { spawn } from 'child_process';
import os from 'os';
import { convertToWav } from './audioProcessor';

const WHISPER = "/home/sak/Desktop/whisper.cpp/build/bin/whisper-cli";
const MODEL = "/home/sak/Desktop/whisper.cpp/models/ggml-small-q8_0.bin";

function runWhisper(audioPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [
      "-m", MODEL,
      "-f", audioPath,
      "-nt",
      "-t", os.cpus().length.toString()
    ];

    const whisper = spawn(WHISPER, args);

    let result = "";
    let error = "";

    whisper.stdout.on("data", (data) => {
      result += data.toString();
    });

    whisper.stderr.on("data", (data) => {
      error += data.toString();
    });

    whisper.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(error));
      } else {
        resolve(result);
      }
    });
  });
}

export function TranscribeAudio() {
  return async (req: Request & { file?: any }, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'No audio file received' });
      return;
    }

    try {
      // Convert to WAV — ffmpeg writes directly to processing/current.wav
      const filePath = await convertToWav(req.file.buffer);
      console.log(`Saved WAV to: ${filePath}`);

      // Run Whisper on the saved WAV file
      const transcript = await runWhisper(filePath);
      console.log('Whisper output:', transcript);

      res.json({ transcript: transcript.trim() });
    } catch (err: any) {
      console.error('Transcription error:', err.message);
      res.status(500).json({ error: err.message });
    }
  };
}
