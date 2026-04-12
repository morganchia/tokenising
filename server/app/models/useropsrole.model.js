module.exports = (sequelize, Sequelize) => {
  const UserOpsRole = sequelize.define("user_opsroles", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: Sequelize.INTEGER
    },
    opsroleId: {
      type: Sequelize.INTEGER
    },    
    roleId: {
        type: Sequelize.INTEGER
    },    
    transactionType: {
      type: Sequelize.STRING
    },
  });

  return UserOpsRole;
};