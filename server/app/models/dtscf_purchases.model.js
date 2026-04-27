module.exports = (sequelize, Sequelize) => {
  const Dtscf_Purchases = sequelize.define("dtscf_purchases", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      unique: true,
      autoIncrement: true,
      initialAutoIncrement: 1,
    },
    description: {
      type: Sequelize.STRING,  // varchar(50)
      unique: false,
      allowNull: false
    },
    amount: {
      type: Sequelize.INTEGER,  
      defaultValue: 0,
      allowNull: false
    },
    dtscf_project_id: {
      type: Sequelize.INTEGER  // reference the id in Dtscf project table
    },
    dtscf_contractor_id: {
      type: Sequelize.INTEGER  // reference the id in Dtscf contractor table
    },
    dtscf_milestone_id: {
      type: Sequelize.INTEGER  // reference the id in Dtscf milestone table
    },
    invoice_blob: {
      type: Sequelize.BLOB('long')  // store invoice file as blob
    },
    dbstatus:{
      type: Sequelize.STRING,  // "PENDING", "APPROVED", "REJECTED"
    },
    description_changed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    amount_changed: {  
      type: Sequelize.BOOLEAN,  
      defaultValue: false,
    },
    dtscf_project_id_changed: {  
      type: Sequelize.BOOLEAN,  
      defaultValue: false,
    },
    dtscf_contractor_id_changed: {  
      type: Sequelize.BOOLEAN,  
      defaultValue: false,
    },
    dtscf_milestone_id_changed: {
      type: Sequelize.BOOLEAN  // reference the id in Dtscf milestone table
    },
    description_original: {
      type: Sequelize.STRING,  // varchar(50)
    },
    amount_original: {  
      type: Sequelize.INTEGER,  
    },
    dtscf_project_id_original: {  
      type: Sequelize.INTEGER,  
    },
    dtscf_contractor_id_original: {  
      type: Sequelize.INTEGER,  
    },
    dtscf_milestone_id_original: {  
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
  return Dtscf_Purchases;
};
