export const Z = {
  BASE: 0,
  LOW: 10,
  FLOAT: 20,
  OVERLAY: 40,   // background blur
  NAV: 50,       // navbar sits ABOVE overlay
  DROPDOWN: 60,
  SIDEBAR: 80,   // Collection Actions panel
  MODAL: 90,
  TOAST: 100,
} as const;


export const Z_INDEX = {
  navbar: Z.NAV,
  dropdown: Z.DROPDOWN,
  modal: Z.MODAL,
  sidebar: Z.SIDEBAR,
  overlay: Z.OVERLAY,
  toast: Z.TOAST,
}
