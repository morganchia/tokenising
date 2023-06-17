module.exports = (sequelize, Sequelize) => {
  const UserOpsRole = sequelize.define("user_opsroles", {
    userId: {
      type: Sequelize.INTEGER,
      primaryKey: true
    },
    opsroleId: {
      type: Sequelize.INTEGER,
      primaryKey: true
    },    transactionType: {
      type: Sequelize.STRING
    }
  });

  return UserOpsRole;
};