if (process.env.NODE_ENV === 'production') {
  /*
  module.exports = {
    HOST: "mwgmw3rs78pvwk4e.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    USER: "krode71wvj3vjm82",
    PASSWORD: "rix3r6v3z50zpw09",
    PORT: 3306,
    DB: "qzhu0pn864t21wsb",
    dialect: "mysql",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };
  */
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
