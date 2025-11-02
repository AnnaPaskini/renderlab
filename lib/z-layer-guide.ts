export const Z = {
  BASE: 0,
  LOW: 10,
  FLOAT: 20,
  OVERLAY: 30,
  NAV: 20,
  DROPDOWN: 30,
  SIDEBAR: 30,
  MODAL: 40,
  TOASTER: 50,
} as const;


export const Z_INDEX = {
  navbar: Z.NAV,
  dropdown: Z.DROPDOWN,
  modal: Z.MODAL,
  sidebar: Z.SIDEBAR,
  overlay: Z.OVERLAY,
  toast: Z.TOASTER,
}
