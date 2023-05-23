module.exports = (sequelize, Sequelize) => {
    const Settings = sequelize.define("settings", {
      privateKey: {
        type: Sequelize.STRING,
      },
      publicKey: {
        type: Sequelize.STRING
      },
      walletaddress: {
        type: Sequelize.STRING
      },
      web3APIkey: {
        type: Sequelize.STRING
      },
    });
  
    return Settings;
  };
  