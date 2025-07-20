export const encodeFaceData = (faceData) => {
  const jsonString = JSON.stringify(faceData);
  return btoa(jsonString);
};

export const decodeFaceData = (encodedData) => {
  try {
    const jsonString = atob(encodedData);
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error('Invalid encoded face data');
  }
};