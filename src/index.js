import React, {PureComponent} from 'react';
import {Image as RNImage} from 'react-native';
import PropTypes from 'prop-types';
import Svg, {Defs, G, Rect, Path, Image, ClipPath} from 'react-native-svg';
import genMatrix from './genMatrix';

const DEFAULT_SIZE = 100;
const DEFAULT_BG_COLOR = 'white';

/* calculate the size of the cell and draw the path */
function calculateMatrix(props) {
  const {value, size, ecl, onError} = props;
  try {
    const matrix = genMatrix(value, ecl);
    const cellSize = size / matrix.length;
    return {
      value,
      size,
      cellSize,
      path: transformMatrixIntoPath(cellSize, matrix)
    };
  } catch (error) {
    if (onError && typeof onError === 'function') {
      onError(error);
    } else {
      // Pass the error when no handler presented
      throw error;
    }
  }
  return {};
}

/* project the matrix into path draw */
function transformMatrixIntoPath(cellSize, matrix) {
  // adjust origin
  let d = '';
  matrix.forEach((row, i) => {
    let needDraw = false;
    row.forEach((column, j) => {
      if (column) {
        if (!needDraw) {
          d += `M${cellSize * j} ${cellSize / 2 + cellSize * i} `;
          needDraw = true;
        }
        if (needDraw && j === matrix.length - 1) {
          d += `L${cellSize * (j + 1)} ${cellSize / 2 + cellSize * i} `;
        }
      } else {
        if (needDraw) {
          d += `L${cellSize * j} ${cellSize / 2 + cellSize * i} `;
          needDraw = false;
        }
      }
    });
  });
  return d;
}

/**
 * A simple component for displaying QR Code using svg
 */
export default class QRCode extends PureComponent {
  static propTypes = {
    /* what the qr code stands for */
    value: PropTypes.string,
    /* the whole component size */
    size: PropTypes.number,
    /* the color of the cell */
    color: PropTypes.string,
    /* the color of the background */
    backgroundColor: PropTypes.string,
    /* an image source object. example {uri: 'base64string'} or {require('pathToImage')} */
    logo: RNImage.propTypes.source,
    /* logo size in pixels */
    logoSize: PropTypes.number,
    /* the logo gets a filled rectangular background with this color. Use 'transparent'
         if your logo already has its own backdrop. Default = same as backgroundColor */
    logoBackgroundColor: PropTypes.string,
    /* logo's distance to its wrapper */
    logoMargin: PropTypes.number,
    /* the border-radius of logo image */
    logoBorderRadius: PropTypes.number,
    /* get svg ref for further usage */
    getRef: PropTypes.func,
    /* error correction level */
    ecl: PropTypes.oneOf(['L', 'M', 'Q', 'H']),
    /* Callback function that's called in case if any errors
     * appeared during the process of code generating.
     * Error object is passed to the callback.
     */
    onError: PropTypes.func,
    /* padding around the qr code */
    padding: PropTypes.number,
  };

  static defaultProps = {
    value: 'This is a QR Code.',
    size: DEFAULT_SIZE,
    color: 'black',
    backgroundColor: DEFAULT_BG_COLOR,
    logoSize: DEFAULT_SIZE * 0.2,
    logoBackgroundColor: DEFAULT_BG_COLOR,
    logoMargin: 2,
    logoBorderRadius: 0,
    ecl: 'M',
    onError: undefined,
    padding: 0,
  };

  constructor(props) {
    super(props);
    this.state = calculateMatrix(props);
  }

  static getDerivedStateFromProps(props, state) {
    // if value has changed, re-calculateMatrix
    if (props.value !== state.value || props.size !== state.size) {
      return calculateMatrix(props);
    }
    return null;
  }

  render() {
    const {
      getRef,
      size,
      color,
      backgroundColor,
      logo,
      logoSize,
      logoMargin,
      logoBackgroundColor,
      logoBorderRadius,
      padding,
    } = this.props;

    const logoPosition = size / 2 - logoSize / 2 - logoMargin + (padding / 2);
    const logoWrapperSize = logoSize + logoMargin * 2;
    const logoWrapperBorderRadius =
      logoBorderRadius + (logoBorderRadius && logoMargin);

    const {cellSize, path} = this.state;

    return (
      <Svg ref={getRef} width={size + padding} height={size + padding}>
        <Defs>
          <ClipPath id="clip-wrapper">
            <Rect
              width={logoWrapperSize}
              height={logoWrapperSize}
              rx={logoWrapperBorderRadius}
              ry={logoWrapperBorderRadius}
            />
          </ClipPath>
          <ClipPath id="clip-logo">
            <Rect
              width={logoSize}
              height={logoSize}
              rx={logoBorderRadius}
              ry={logoBorderRadius}
            />
          </ClipPath>
        </Defs>
        <Rect width={size + padding} height={size + padding} fill={backgroundColor} />
        {path && cellSize && (
          <Path x={padding / 2} y={padding / 2} d={path} stroke={color} strokeWidth={cellSize}  />
        )}
        {logo && (
          <G x={logoPosition} y={logoPosition}>
            <Rect
              width={logoWrapperSize}
              height={logoWrapperSize}
              fill={logoBackgroundColor}
              clipPath="url(#clip-wrapper)"
            />
            <G x={logoMargin} y={logoMargin}>
              <Image
                width={logoSize}
                height={logoSize}
                preserveAspectRatio="xMidYMid slice"
                href={logo}
                clipPath="url(#clip-logo)"
              />
            </G>
          </G>
        )}
      </Svg>
    );
  }
}
