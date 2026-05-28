module.exports = (sequelize, Sequelize) => {
  const Dtscf_Organisations = sequelize.define("dtscf_organisations", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      unique: true,
      autoIncrement: true,
      initialAutoIncrement: 1,
    },
    name: {
      type: Sequelize.STRING,  // varchar(80)
      unique: false,
      allowNull: false
    },
    type: {
      type: Sequelize.INTEGER,  // 1. Anchor, 2. Contractor / Subcontractor
      defaultValue: 0,
      allowNull: false
    },
    walletaddress: {
      type: Sequelize.STRING,  // varchar(255)
      unique: false,
      allowNull: false
    }
  });
  return Dtscf_Organisations;
};
