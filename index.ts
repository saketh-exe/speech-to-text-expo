import express, { Request, Response } from 'express';
import "dotenv/config";
import multer, { File as MulterFile } from 'multer';
import { TranscribeAudio } from './functions/speechToText';

const app = express();
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;

app.post(
  '/api/speech-to-text',
  upload.single('audio'),
  TranscribeAudio()
);

app.get('/', (req: Request, res: Response) => {
  console.log("smt")
  res.send('The speech to text API is running!');
});

app.listen(PORT, () => {
  console.log('Server is running on port ' + PORT);
});