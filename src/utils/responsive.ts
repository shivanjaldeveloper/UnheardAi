import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

export const wp = (percentage: number) => {
  return PixelRatio.roundToNearestPixel((width * percentage) / 100);
};

export const hp = (percentage: number) => {
  return PixelRatio.roundToNearestPixel((height * percentage) / 100);
};

export { width, height };
