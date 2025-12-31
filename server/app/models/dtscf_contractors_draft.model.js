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
    dtscf_project_id: {
      type: Sequelize.INTEGER  // reference the id in Dtscf project table
    },
    dtscf_parent_contractor_id: {
      type: Sequelize.INTEGER  // reference the id in Dtscf project table
    },
    name_changed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    budget_changed: {  
      type: Sequelize.BOOLEAN,  
      defaultValue: false,
    },
    walletaddress_changed: {  
      type: Sequelize.BOOLEAN,  
      defaultValue: false,
    },
    dtscf_project_id_changed: {  
      type: Sequelize.BOOLEAN,  
      defaultValue: false,
    },
    dtscf_parent_contractor_id_changed: {  
      type: Sequelize.BOOLEAN,  
      defaultValue: false,
    },
    name_original: {
      type: Sequelize.STRING,  // varchar(50)
    },
    budget_original: {  
      type: Sequelize.INTEGER,  
    },
    walletaddress_original: {  
      type: Sequelize.STRING,  
    },
    dtscf_project_id_original: {  
      type: Sequelize.INTEGER,  
    },
    dtscf_parent_contractor_id_original: {  
      type: Sequelize.INTEGER,  
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('NOW()'),
    },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('NOW()'),
    }
  });
  return Dtscf_Contractors_Draft;
};