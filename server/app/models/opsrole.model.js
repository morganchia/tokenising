module.exports = (sequelize, Sequelize) => {
    const OpsRole = sequelize.define("opsroles", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING
      }
    });
  
    return OpsRole;
  };