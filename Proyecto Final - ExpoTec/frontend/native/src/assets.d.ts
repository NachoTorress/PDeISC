/** Declaraciones de TypeScript para importar imágenes como módulos. */
declare module "*.jpg" {
  const source: import("react-native").ImageSourcePropType;
  export default source;
}
declare module "*.png" {
  const source: import("react-native").ImageSourcePropType;
  export default source;
}
