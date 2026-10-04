type Nav = (href: string, label?: string) => void;
let nav: Nav | null = null;
export const setNavigator = (n: Nav | null) => { nav = n; };
export const navigateTo = (href: string, label?: string) => {
  if (nav) nav(href, label);
  else window.location.href = href;
};
