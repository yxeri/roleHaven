/**
 * Create a randomized string
 * @param {string} params.length Length of string
 * @returns {string} Randomized string
 */
function createRandString({ length }) {
  const selection = 'abcdefghijklmnopqrstuvwxyz';
  const randomLength = selection.length;
  let result = '';

  for (let i = 0; i < length; i += 1) {
    const randomVal = Math.round(Math.random() * (randomLength - 1));

    result += selection[randomVal];
  }

  return result;
}

exports.createRandString = createRandString;
