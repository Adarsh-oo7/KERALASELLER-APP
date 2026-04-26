// Use @assets alias — resolves correctly on all platforms including Windows
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Images = {
  // @ts-ignore
  logo: require('@assets/icon.png') as number,
};

export default Images;
