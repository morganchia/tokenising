// utils/logDataValues.js
const logDataValues = (message, data) => {
  if (Array.isArray(data)) {
    console.log(message, data.map(item => item.dataValues));
  } else if (data && data.dataValues) {
    console.log(message, data.dataValues);
  } else {
    console.log(message, data);
  }
};

module.exports = { logDataValues };