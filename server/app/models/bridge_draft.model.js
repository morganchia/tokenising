module.exports = (sequelize, Sequelize) => {
  const bridges_draft = sequelize.define("bridges_draft", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      unique: true,
      autoIncrement: true,
      initialAutoIncrement: 1,
    },
    name: {
      type: Sequelize.STRING,  // varchar(45)
      unique: false,
      allowNull: false
    },
    sourceblockchain: {            // network id
      type: Sequelize.INTEGER,  
      defaultValue: 0
    },
    destblockchain: {              // network id
      type: Sequelize.INTEGER,  
      defaultValue: 0
    },
    sourcebridgesmartcontractaddress: {  // varchar(80)
      type: Sequelize.STRING  
    },
    destbridgesmartcontractaddress: {  // varchar(80)
      type: Sequelize.STRING  
    },
    sourcetokensmartcontractaddress: {  // varchar(80)
      type: Sequelize.STRING  
    },
    desttokensmartcontractaddress: {  // varchar(80)
      type: Sequelize.STRING  
    },
    sourcetokensymbol: {  // varchar(20)
      type: Sequelize.STRING  
    },
    desttokensymbol: {    // varchar(20)
      type: Sequelize.STRING  
    },
    status: {
      type: Sequelize.INTEGER  // 0=created, 1=submitted pending checker, 2=checked, 3=approved
    },
    txntype: {
      type: Sequelize.INTEGER  // 0=create, 1=edit, 2=delete
    },
    actionby: {
      type: Sequelize.STRING  // username
    },
    actiontimedate: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('NOW()'),
    },
    approvedbridgeid: {
      type: Sequelize.INTEGER  // reference the id in Bridges table
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

  return bridges_draft;
};
