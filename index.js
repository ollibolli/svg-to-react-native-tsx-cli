#!/usr/bin/env node

'use strict';

// Vendor includes
const chalk = require('chalk');
const fs = require('fs');
const yargs = require('yargs');
const path = require('path');
const jsdom = require('jsdom-no-contextify');

// Language files
const content = require('./lang/en');

// Local includes
const createComponentName = require('./src/createComponentName');
const formatSVG = require('./src/formatSVG');
const generateComponent = require('./src/generateComponent');
const printErrors = require('./src/output').printErrors;
const removeStyle = require('./src/removeStyle');
const replaceAllStrings = require('./src/replaceAllStrings');
const SVGtoJSX = require('./src/svg-to-jsx');

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

let indexOutput = '';

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
        console.log(
          `${filesWritten} components created. That must be some kind of record`
        );
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

      jsdom.env(output, (err, window) => {
        const body = window.document.getElementsByTagName('body')[0];

        if (rmStyle) {
          removeStyle(body);
        }

        // Add width and height
        // The order of precedence of how width/height is set on to an element is as follows:
        // 1st - passed in props are always priority one. This gives run time control to the container
        // 2nd - svg set width/height is second priority
        // 3rd - if no props, and no svg width/height, use the viewbox width/height as the width/height
        // 4th - if no props, svg width/height or viewbox, simlpy set it to 50px/50px
        let defaultWidth = '50px';
        let defaultheight = '50px';
        if (body.firstChild.hasAttribute('viewBox')) {
          const [minX, minY, width, height] = body.firstChild
            .getAttribute('viewBox')
            .split(/[,\s]+/);
          defaultWidth = width;
          defaultheight = height;
        }

        if (!body.firstChild.hasAttribute('width')) {
          body.firstChild.setAttribute('width', defaultWidth);
        }
        if (!body.firstChild.hasAttribute('height')) {
          body.firstChild.setAttribute('height', defaultheight);
        }

        // Add generic props attribute to parent element, allowing props to be passed to the svg
        // such as className
        body.firstChild.setAttribute(':props:', '');

        // Now that we are done with manipulating the node/s we can return it back as a string
        output = body.innerHTML;

        // Convert from SVG to JSX
        return SVGtoJSX(output, (err, jsx) => {
          if (err){
            reject(err);
          }
          // Convert any html tags to react-native-svg tags
          jsx = replaceAllStrings(jsx);

          // Wrap it up in a React component
          jsx = generateComponent(jsx, fileToWrite);

          writeFile(jsx, fileToWrite).then(() => {
            if (index && directoryPath) {
              indexOutput += `\nexport {default as ${fileToWrite}} from './${fileToWrite}'`
            }
            resolve();
          }).catch(reject);
        });
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
        writeFile(indexOutput, path.resolve(process.cwd(), outputPath, `index`));
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
