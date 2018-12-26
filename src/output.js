'use strict'

const chalk = require('chalk');

/**
 * Displays errors in a console friendly way
 * @param  string text The text to output
 * @return undefined
 */
module.exports.printErrors = function(text) {
  console.log(chalk.red(text));
}
module.exports.printWarning = function(text) {
  console.log(chalk.y(text));
}
