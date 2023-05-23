if (process.env.NODE_ENV === 'production') {
  module.exports = {
    HOST: "us-cdbr-east-06.cleardb.net",
    USER: "b9483083401350",
    PASSWORD: "7ef1aef2",
    PORT: 3306,
    DB: "heroku_5371b064224d9c8",
    dialect: "mysql",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };
} else {
  module.exports = {
    HOST: "localhost",
    USER: "root",
    PASSWORD: "Blockchain&DigitalAssets",
    PORT: 3322,
    DB: "dsgd",
    dialect: "mysql",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };
}
