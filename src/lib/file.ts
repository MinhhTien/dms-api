//const combineImage = require('combine-image');
import pdfImgConvert from 'pdf-img-convert';
import fs from 'fs';
import { resolve } from 'path';
import Jimp from 'jimp';
import { UUID } from './global.type';

export const convert = async (fileName: string) => {
  try {
    console.log(`Converting ${fileName} ...`);
    const name = fileName.split('.')[0];
    const pngFileName = resolve('temp', `${name}.png`);
    if (!fs.existsSync('temp')) fs.mkdirSync('temp');

    // if png file already exist, return
    if (fs.existsSync(pngFileName)) return;

    const pdfFilePath = resolve('uploads', fileName);
    if (!fs.existsSync(pdfFilePath)) {
      console.log('convert::' + pdfFilePath + 'File not exist');
      return;
    }

    const outputImages = await pdfImgConvert.convert(pdfFilePath);

    // write first image to png file
    console.log('outputImages length: ', outputImages.length);
    if (outputImages.length === 0) return;
    fs.writeFileSync(`temp/${name}.png`, outputImages[0]);

    console.log(`Convert ${fileName} success!`);
  } catch (error) {
    console.log('Convert: ' + error);
  }
};

export const compareImage = async (
  newFileName: string,
  storageUrl: string,
  documentId: UUID
) => {
  try {
    const newFilePNG = newFileName.split('.')[0];
    const storageFilePNG = storageUrl.split('.')[0];

    const newFilePath = resolve('temp', `${newFilePNG}.png`);
    if (!fs.existsSync(newFilePath)) {
      console.log(newFilePath + ' new file not exist');
      return { duplicatePercent: 0, documentId: null };
    }

    const storageFilePath = resolve('temp', `${storageFilePNG}.png`);
    if (!fs.existsSync(storageFilePath)) {
      console.log(storageFilePath + ' old storage file not exist');
      return { duplicatePercent: 0, documentId: null };
    }

    const newFile = await Jimp.read(`temp/${newFilePNG}.png`);
    const oldFile = await Jimp.read(`temp/${storageFilePNG}.png`);

    const diff = Jimp.diff(newFile, oldFile).percent;
    return { duplicatePercent: Math.round((1 - diff) * 100) / 100, documentId };
  } catch (error) {
    console.log('compareImage' + error);
    return { duplicatePercent: 0, documentId: null };
  }
};
