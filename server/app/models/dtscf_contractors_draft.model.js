module.exports = (sequelize, Sequelize) => {
  const Dtscf_Contractors_Draft = sequelize.define("dtscf_contractors_drafts", {  
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      unique: true,
      autoIncrement: true,
      initialAutoIncrement: 1,
    },
    name: {
      type: Sequelize.STRING,  // varchar(50)
      unique: false,
      allowNull: false
    },
    budget: {
      type: Sequelize.INTEGER,  
      defaultValue: 0,
      allowNull: false
    },
    walletaddress: {
      type: Sequelize.STRING,  // varchar(255)
      unique: false,
      allowNull: false
    },
    organisation_id: {
      type: Sequelize.INTEGER  // reference the id in Dtscf_organisation table
    },
    dtscf_project_id: {
      type: Sequelize.INTEGER  // reference the id in Dtscf project table
    },
    dtscf_parent_contractor_id: {
      type: Sequelize.INTEGER  // reference the id in Dtscf project table
    },
  });
  return Dtscf_Contractors_Draft;
};