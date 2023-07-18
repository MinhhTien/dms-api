const combineImage = require('combine-image');
import pdfImgConvert from 'pdf-img-convert';
import fs from 'fs';
import { resolve } from 'path';
import Jimp from 'jimp';
import { UUID } from './global.type';

export const convert = async (fileName: string) => {
  const name = fileName.split('.')[0];
  const pngFileName = resolve('temp', `${name}.png`);
  if (!fs.existsSync('temp')) fs.mkdirSync('temp');

  // if png file already exist, return
  if (fs.existsSync(pngFileName)) return;

  const pdfFilePath = resolve('uploads', fileName);
  if (!fs.existsSync(pdfFilePath)) return;

  const outputImages = await pdfImgConvert.convert(pdfFilePath);
  const tempFileNameList: string[] = [];
  const writeFilePromise = [];

  let tempFileName = '';
  for (let i = 0; i < outputImages.length; i++) {
    tempFileName = `temp/${name}` + i + '.png';
    tempFileNameList.push(tempFileName);
    writeFilePromise.push(
      fs.writeFile(tempFileName, outputImages[i], function (error) {
        if (error) {
          console.error('Error: ' + error);
        }
      })
    );
  }

  await Promise.all(writeFilePromise);
  const result = await combineImage(tempFileNameList, {
    direction: 'row',
  });

  result.write(`temp/${name}.png`, () => {
    console.log('Convert success!');
    tempFileNameList.forEach((fileName) => {
      fs.unlink(fileName, (err) => {
        if (err) console.log(err);
      });
    });
  });
};

export const compareImage = async (
  newFileName: string,
  storageUrl: string,
  documentId: UUID
) => {
  const newFilePNG = newFileName.split('.')[0];
  const storageFilePNG = storageUrl.split('.')[0];

  const newFilePath = resolve('temp', `${newFilePNG}.png`);
  if (!fs.existsSync(newFilePath))
    return { duplicatePercent: 0, documentId: null };

  const storageFilePath = resolve('temp', `${storageFilePNG}.png`);
  if (!fs.existsSync(storageFilePath))
    return { duplicatePercent: 0, documentId: null };

  const newFile = await Jimp.read(`temp/${newFilePNG}.png`);
  const oldFile = await Jimp.read(`temp/${storageFilePNG}.png`);

  const diff = Jimp.diff(newFile, oldFile).percent;
  return { duplicatePercent: Math.round((1 - diff) * 100) / 100, documentId };
};
