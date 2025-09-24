/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '../../constants/colors';
import { useColorScheme } from './use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: 'primaryDark' | 'primaryLight' | 'primaryYellow' | 'primaryOrange' | 'background' | 'white' | 'black' | 'text' | 'icon' | 'tabIconDefault' | 'tabIconSelected'
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme as 'light' | 'dark'];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    // Return appropriate color based on colorName and theme
    if (colorName === 'background') {
      return Colors.background;
    }
    if (colorName === 'text') {
      return Colors.primaryDark; // Use primaryDark for text as default
    }
    if (colorName === 'primaryDark' || colorName === 'primaryLight') {
      return colorName === 'primaryDark' ? Colors.primaryDark : Colors.primaryLight;
    }
    return Colors.primaryDark;
  }
}
