export const isValidObjectId = (id) => {
  if (!id) return false;
  const checkForHexRegExp = /^[0-9a-fA-F]{24}$/;
  return checkForHexRegExp.test(id);
}; 