module.exports = (sequelize, Sequelize) => {
  const Dtscf_Purchases_Draft = sequelize.define("dtscf_purchases_draft", {
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
    invoice_blob: {
      type: Sequelize.BLOB('long')  // store invoice file as blob
    },
    description_changed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    amount_changed: {  
      type: Sequelize.INTEGER,  
      defaultValue: false,
    },
    dtscf_project_id_changed: {  
      type: Sequelize.INTEGER,  
      defaultValue: false,
    },
    dtscf_contractor_id_changed: {  
      type: Sequelize.INTEGER,  
      defaultValue: false,
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
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('NOW()'),
    },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('NOW()'),
    }
  });
  return Dtscf_Purchases_Draft;
};
