import * as attrValidators from '../typeCheck/react-native-svg-interfaces-v8.0.8.d-ti';
import {TProp, createCheckers, Checker} from "ts-interface-checker";

const checkers = createCheckers(attrValidators.default);

const ALLOWED_TAGS: {[key: string]:{props: TProp[], checker: Checker}} = {
  'Svg': {props: attrValidators.SvgProps.props, checker: checkers.SvgProps},
  'Circle': {props: attrValidators.CircleProps.props, checker: checkers.Circle},
  'ClipPath': {props: attrValidators.ClipPathProps.props, checker: checkers.ClipsPath},
  'Ellipse': {props: attrValidators.EllipseProps.props, checker: checkers.Ecllipse},
  'G': {props: attrValidators.GProps.props, checker: checkers.G},
  'Image': {props: attrValidators.ImageProps.props, checker: checkers.Image},
  'LinearGradient': {props: attrValidators.LinearGradientProps.props, checker: checkers.LinearGradient},
  'RadialGradient': {props: attrValidators.RadialGradientProps.props, checker: checkers.RadialGradient},
  'Line': {props: attrValidators.LineProps.props, checker: checkers.Line},
  'Path': {props: attrValidators.PathProps.props, checker: checkers.Path},
  'Pattern': {props: attrValidators.PatternProps.props, checker: checkers.Pattern},
  'Polygon': {props: attrValidators.PolygonProps.props, checker: checkers.Polygon},
  'Polyline': {props: attrValidators.PolylineProps.props, checker: checkers.Polyline},
  'Rect': {props: attrValidators.RectProps.props, checker: checkers.Rect},
  'Symbol': {props: attrValidators.SymbolProps.props, checker: checkers.Symbol},
  'Text': {props: attrValidators.TextProps.props, checker: checkers.Text},
  'TextPath': {props: attrValidators.TextPathProps.props, checker: checkers.TextPath},
  'TSpan': {props: attrValidators.TSpanProps.props, checker: checkers.TSpan},
  'Use': {props: attrValidators.UseProps.props, checker: checkers.Use},
  'Mask': {props: attrValidators.MaskProps.props, checker: checkers.Mask},
  'Defs': {props: attrValidators.DefinitionProps.props, checker: checkers.Defs},
  'Stop': {props: attrValidators.StopProps.props, checker: checkers.Stop},
};

interface Element {
  [key: string]: any,
}

var DATA_ATTRIBUTE = /^data-/i;

exports.cssProperty = function(string: string) {
  var unprefixed = string.replace(/^-ms/, 'ms');

  return exports.camelCase(unprefixed);
};

exports.camelCase = function(string: string) {
  return string.replace(/(?:-|_)([a-z])/g, function(g) { return g[1].toUpperCase(); });
};

exports.processAttributeName = function(name: string) {
  return exports.camelCase(name);
};

exports.processTagName = function(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
};

exports.unnamespaceAttributeName = function(name: string) {
  return name.replace(/(\w+):(\w)/i, function(match, namespace, char) {
    return namespace + char.toUpperCase();
  });
};

exports.sanitizeAttributes = function(tagName: string, attributes: {[key:string]: any}, fileName: string) {
  const validator = ALLOWED_TAGS[tagName];
  if (!attributes || !validator) return null;

  let cleanedAttributes: any = {};

  if (validator.checker) {
    Object.keys(attributes).map((key: string) => {
        try {
          validator.checker.getProp(key).check(attributes[key])
          cleanedAttributes[key] = attributes[key];
        } catch (e) {
          console.log(`WARNING: Unsupported attribute "${key}" in tag "${tagName}" removed. In ${fileName}`);
        }
    });
    return cleanedAttributes;
  } else {
    return attributes;
  }
};

exports.sanitizeChildren = function(children: any[], filename: string) {
  if (!children) return null;
  return children.filter(function isTagAllowed(child) {
    return Object.keys(ALLOWED_TAGS).includes(child.tagName) ||
      console.log(`Warning: Unsupported tag "${child.tagName}" removed. In ${filename}`);
  });
};

exports.styleAttribute = function(string: string) {
  var object = string.split(/\s*;\s*/g).reduce(function(hash: {[key:string]: any}, keyValue) {
    var split = keyValue.split(/\s*\:\s*/);
    var key = exports.camelCase((split[0] || '').trim());
    var value = (split[1] || '').trim();

    hash[key] = value;

    return hash;
  }, {});

  return JSON.stringify(object);
};

exports.forEach = function(element: Element, callback: (e: any)=> void) {
  element.children && element.children.forEach(function(child: Element) {
    exports.forEach(child, callback);
  });

  callback(element);
};

exports.filter = function(element: Element, test: any) {
  var filtered: Element[] = [];

  exports.forEach(element, function(child: Element) {
    if (test(child)) filtered.push(child);
  });

  return filtered;
};

exports.findById = function(element: Element, id: string) {
  return exports.filter(element, function(node: Element) {
    return node.attributes.id === id;
  }).shift() || null;
};

exports.supportsAllAttributes = function(element: Element) {
  var hasHyphen = element.tagName.indexOf('-') !== -1;
  var hasIsAttribute = 'is' in element.attributes;

  return hasHyphen || hasIsAttribute;
};
