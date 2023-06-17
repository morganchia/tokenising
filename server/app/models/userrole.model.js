module.exports = (sequelize, Sequelize) => {
    const UserRole = sequelize.define("user_roles", {
      userId: {
        type: Sequelize.INTEGER,
        primaryKey: true
      },
      roleId: {
        type: Sequelize.INTEGER,
        primaryKey: true
      },    
    });
  
    return UserRole;
  };