'use strict';

/**
 * Creates a full component string based upon provided svg data and a component name
 * @param  string svgOutput     The svg data, preformatted
 * @param  string componentName The name of the component without extension
 * @return string               The parsed component string
 */
module.exports = (svgOutput, componentName, sendprops) => {
  svgOutput = svgOutput
    .split('\n')
    .map(line => `    ${line}`)
    .join('\n');

  svgOutput = svgOutput.replace(/(<svg.*)(>)/gi, '$1 {...props} $2');

  return `
import React from 'react';
import {
  Svg,
  Circle,
  Ellipse,
  G,
  LinearGradient,
  RadialGradient,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
  Symbol,
  Text,
  Use,
  Defs,
  Stop,
  SvgProps
} from 'react-native-svg';

export default function ${componentName}(props: SvgProps) {
  return (
${svgOutput}
  );
}
`;
}
