module.exports = (sequelize, Sequelize) => {
  const Dtscf_Draft = sequelize.define("dtscf_draft", {
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
    description: {
      type: Sequelize.STRING,  // varchar(45)
      allowNull: true
    },
    totalBudget: {
      type: Sequelize.INTEGER,  
      defaultValue: 0,
      allowNull: false
    },
    startdate: {
      type: Sequelize.DATE,
      allowNull: false
    },
    enddate: {
      type: Sequelize.DATE,
      allowNull: false
    },
    blockchain: {
      type: Sequelize.INTEGER   // chain id
    },
    txntype: {
      type: Sequelize.INTEGER  // 0=create, 1=edit, 2=delete
    },
    status: {
      type: Sequelize.INTEGER  // 0=created, 1=submitted pending checker, 2=checked, 3=approved
    },
    draftdtscfid: {
      type: Sequelize.INTEGER   // reference the id in Dtscf_draft table
    },
    name_changed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    description_changed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    totalBudget_changed: {  
      type: Sequelize.INTEGER,  
      defaultValue: false,
    },
    startdate_changed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    enddate_changed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    name_original: {
      type: Sequelize.STRING,  // varchar(50)
    },
    description_original: {
      type: Sequelize.STRING,  // varchar(255)
    },
    totalBudget_original: {  
      type: Sequelize.INTEGER,  
    },
    startdate_original: {
      type: Sequelize.DATE
    },
    enddate_original: {
      type: Sequelize.DATE
    },
    actionby: {
      type: Sequelize.STRING  // username
    },
    actiontimedate: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('NOW()'),
    },
    maker: {
      type: Sequelize.INTEGER  // userid
    },
    checker: {
      type: Sequelize.INTEGER  // userid
    },
    approver: {
      type: Sequelize.INTEGER  // userid
    },
    checkerComments: {
      type: Sequelize.STRING 
    },
    approverComments: {
      type: Sequelize.STRING 
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

  return Dtscf_Draft;
};
