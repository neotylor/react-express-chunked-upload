import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fs from "fs";
import path from "path";
import md5 from "md5";
import dotenv from "dotenv";
// Get the directory path using import.meta.url
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

// Config environment variables
dotenv.config({path: path.resolve(__dirname, '.env')});

const port = process.env.PORT || 4001;
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:3001'];
const fileSize = process.env.FILE_SIZE || 100;

const app = express();
app.use(bodyParser.raw({type:'application/octet-stream', limit: fileSize+'mb'}));
app.use(cors({
  origin: allowedOrigins,
}));
app.use('/uploads', express.static('uploads'));

app.post('/upload', (req, res) => {
  const {name,currentChunkIndex,totalChunks} = req.query;
  const firstChunk = parseInt(currentChunkIndex) === 0;
  const lastChunk = parseInt(currentChunkIndex) === parseInt(totalChunks) -1;
  const ext = name.split('.').pop();
  const data = req.body.toString().split(',')[1];
  const buffer = new Buffer(data, 'base64');
  const tmpFilename = 'tmp_' + md5(name + req.ip) + '.' + ext;
  if (firstChunk && fs.existsSync('./uploads/'+tmpFilename)) {
    fs.unlinkSync('./uploads/'+tmpFilename);
  }
  fs.appendFileSync('./uploads/'+tmpFilename, buffer);
  if (lastChunk) {
    const finalFilename = md5(Date.now()).substr(0, 6) + '.' + ext;
    fs.renameSync('./uploads/'+tmpFilename, './uploads/'+finalFilename);
    res.json({finalFilename});
  } else {
    res.json('ok');
  }
});

// Start your Express server
app.listen(port, () => {
  console.log('Server is running on port '+ port.toString());
});