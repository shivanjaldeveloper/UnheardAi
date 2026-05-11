export const getLogo = (isDark: boolean) => {
  return isDark
    ? require('../assets/images/logo-dark.png')
    : require('../assets/images/logo-light.png');
};
