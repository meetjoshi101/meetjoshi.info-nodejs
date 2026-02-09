const { snakeToCamel } = require('../utils/caseUtils');

function camelCaseResponse(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    return originalJson(snakeToCamel(data));
  };
  next();
}

module.exports = camelCaseResponse;
