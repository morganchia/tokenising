module.exports = (sequelize, Sequelize) => {
  const DvPs_Draft = sequelize.define("dvps_draft", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING,  // varchar(45)
      unique: true,
      allowNull: false
    },
    description: {
      type: Sequelize.STRING,  // varchar(255)
    },    counterparty1: {  // wallet addr
      type: Sequelize.STRING,
      allowNull: false  
    },
    counterparty1: {  // wallet addr
      type: Sequelize.STRING,
      allowNull: false  
    },
    counterparty2: {  // wallet addr
      type: Sequelize.STRING,
      allowNull: false  
    },
    /*
    counterparty1name: {  // recipient name
      type: Sequelize.STRING,
      allowNull: true  
    },
    counterparty2name: {  // recipient name
      type: Sequelize.STRING,
      allowNull: true  
    },
    */
    underlyingTokenID1: {  
      type: Sequelize.INTEGER,  
      allowNull: false
    },
    underlyingTokenID2: {  
      type: Sequelize.INTEGER,  
      allowNull: false
    },
    /*
    Token1name: {  // varchar(45)
      type: Sequelize.STRING,
      allowNull: true  
    },
    Token2name: {  // varchar(45)
      type: Sequelize.STRING,
      allowNull: true  
    },
    */
    smartcontractaddress: {  // varchar(255)
      type: Sequelize.STRING,
      allowNull: true  
    },
    smartcontractaddress1: {  // varchar(255)
      type: Sequelize.STRING,
      allowNull: false  
    },
    smartcontractaddress2: {  // varchar(255)
      type: Sequelize.STRING,
      allowNull: false  
    },
    amount1: {
      type: Sequelize.BIGINT
    },
    amount2: {
      type: Sequelize.BIGINT
    },
    blockchain: {
      type: Sequelize.INTEGER   // chain id
    },
    startdate: {
      type: Sequelize.DATE
    },
    enddate: {
      type: Sequelize.DATE
    },
    txntype: {
      type: Sequelize.INTEGER  // 0=create, 1=edit, 2=delete
    },
    status: {
      type: Sequelize.INTEGER  // 0=created, 1=submitted pending checker, 2=checked, 3=approved
    },
    name_changed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    description_changed: {
      type: Sequelize.BOOLEAN,
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
    amount1_changed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    amount2_changed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    name_original: {
      type: Sequelize.STRING,  // varchar(45)
    },
    description_original: {
      type: Sequelize.STRING,  // varchar(255)
    },
    startdate_original: {
      type: Sequelize.DATE
    },
    enddate_original: {
      type: Sequelize.DATE
    },
    amount1_original: {
      type: Sequelize.BIGINT
    },
    amount2_original: {
      type: Sequelize.BIGINT
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
    approveddvpid: {
      type: Sequelize.INTEGER  // reference the id in Pbm table
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

  return DvPs_Draft;
};
