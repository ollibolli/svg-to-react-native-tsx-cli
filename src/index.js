#!/usr/bin/env node

'use strict';

// Vendor includes
const fs = require('fs');
const yargs = require('yargs');
const path = require('path');
const jsdom = require('jsdom-no-contextify');

// Language files
const content = require('./lang/en');

// Local includes
const createComponentName = require('./createComponentName');
const formatSVG = require('./formatSVG');
const generateComponent = require('./generateComponent');
const printErrors = require('./output').printErrors;
const printWarnig = require('./output').printWarning;
const removeStyle = require('./removeStyle');
const replaceAllStrings = require('./replaceAllStrings');
const SVGtoJSX = require('./svg-to-jsx');

// Argument setup
const args = yargs
  .option('dir', { alias: 'd', default: false })
  .option('format', { default: true })
  .option('output', { alias: 'o' })
  .option('rm-style', { default: false })
  .option('force', { alias: 'f', default: false })
  .option('index', { alias: 'i', default: false }).argv;

// Resolve arguments
const firstArg = args._[0];
const newFileName = args._[1] || 'MyComponent';
const outputPath = args.output;
const directoryPath = args.dir;
const rmStyle = args.rmStyle;
const format = args.format;
const index = args.index;

let indexOutput = 'export default {';

// Bootstrap base variables
const svg = `./${firstArg}.svg`;
let fileCount = 0;

const writeFile = (processedSVG, fileName) => {
  return new Promise((resolve, reject)=>{
    let file;
    let filesWritten = 0;

    if (outputPath) {
      file = path.resolve(process.cwd(), outputPath, `${fileName}.tsx`);
    } else {
      file = path.resolve(process.cwd(), `${fileName}.tsx`);
    }

    fs.writeFile(file, processedSVG, { flag: args.force ? 'w' : 'wx' }, function(err) {
      if (err) {
        if (err.code === 'EEXIST') {
          printErrors(
            `Output file ${file} already exists. Use the force (--force) flag to overwrite the existing files`
          );
        } else {
          printErrors(`Output file ${file} not writable`);
        }
        reject(err);
        return;
      }
      filesWritten++;

      console.log('File written to -> ' + file);

      if (filesWritten === fileCount) {
        console.log(`${filesWritten} components created. That must be some kind of record`);
        console.log();
        console.log(content.processCompleteText);
        console.log();
      }
      resolve();
    });
  });
};

const runUtil = (fileToRead, fileToWrite) => {
  return new Promise((resolve,reject)=> {
    fs.readFile(fileToRead, 'utf8', function(err, file) {
      if (err) {
        printErrors(err);
        reject(err);
      }

      let output = file;
      console.log('processing ' + fileToRead);
      return SVGtoJSX(output, {filename: fileToRead}).then((jsx)=>{
        // Wrap it up in a React component
        jsx = generateComponent(jsx, fileToWrite);

        writeFile(jsx, fileToWrite).then(() => {
          if (index && directoryPath) {
            indexOutput = `export {default as ${fileToWrite}} from './${fileToWrite}'\n${indexOutput}`
            indexOutput += `\n\t${fileToWrite},`
          }
          resolve();
        }).catch(reject);
      });
    });
  });
};

const runUtilForAllInDir = () => {
  fs.readdir(path.resolve(process.cwd(), directoryPath), (err, files) => {
    if (err) {
      return console.log(err);
    }

    Promise.all(files.map((file, i) => {
      const resolvedFile = path.resolve(process.cwd(), directoryPath, file);
      const extension = path.extname(resolvedFile);
      const fileName = path.basename(resolvedFile);
      if (extension === '.svg') {
        // variable instantiated up top
        const componentName = createComponentName(file, fileName);
        const promise = runUtil(resolvedFile, componentName, indexOutput);
        fileCount++;
        return promise;
      }

    })).then(() => {
      if (index && outputPath)
        writeFile(indexOutput += '\n};', path.resolve(process.cwd(), outputPath, `index`));
    }).catch(()=>{})
  });
};

// Exit out early arguments
if (args.help) {
  console.log(content.helptext);
  process.exit(1);
}

if (args.example) {
  console.log(content.exampleText);
  process.exit(1);
}

// Main entry point
if (directoryPath) {
  runUtilForAllInDir();
} else {
  fileCount++;
  runUtil(svg, newFileName);
}
