// Public design dimensions shared by Storybook and the component review matrix.
export const BUTTON_STYLE_OPTIONS = ['primary', 'secondary', 'text'];
export const BUTTON_VARIANT_NODES = {
  primary: { default: '1196:889', hover: '1884:2409', disabled: '1881:2405' },
  secondary: { default: '1394:1189', hover: '1884:2411', disabled: '1881:2403' },
  text: { default: '1884:2413', hover: '1394:1191', disabled: '1881:2407' },
};

export function button_style_args({ button_style = 'primary', ...component_args }) {
  return {
    ...component_args,
    style_variant: button_style === 'text' ? 'ghost' : button_style,
  };
}
