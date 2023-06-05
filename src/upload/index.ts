import { existsSync, mkdirSync } from 'fs';
import multer from 'multer';
import { BadRequestError } from '../constants/response';

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    const destination = 'uploads';
    if (!existsSync(destination)) mkdirSync(destination);
    callback(null, destination);
  },
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileName = `${uniqueSuffix} - ${
      file.filename ? file.filename : file.originalname
    }`;
    callback(null, fileName);
  },
});

const fileFilter: multer.Options['fileFilter'] = (req, file, callback) => {
  // The function should call `callback` with a boolean
  // to indicate if the file should be accepted

  // To reject if this file type is not accepted:
  if (file.mimetype.match('application/pdf')) callback(null, true);
  else callback(new BadRequestError('File is not allowed'));

  // You can always pass an error if something goes wrong:
  //   callback(new Error("I don't have a clue!"));
};

const limits: multer.Options['limits'] = {
  fileSize: 8 * 1024 * 1024, // max size of file 8MB
};

export const multerUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
});
