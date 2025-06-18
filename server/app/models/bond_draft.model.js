module.exports = (sequelize, Sequelize) => {
  const Bonds_Draft = sequelize.define("bonds_draft", {
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
    securityname: {
      type: Sequelize.STRING,  // varchar(45)
      allowNull: false
    },
    ISIN: {
      type: Sequelize.STRING,  // varchar(20)
      allowNull: false
    },
    tokenname: {
      type: Sequelize.STRING,  // varchar(45)
      allowNull: false
    },
    tokensymbol: {
      type: Sequelize.STRING,  // varchar(45)
      allowNull: false
    },
    facevalue: {  
      type: Sequelize.INTEGER,  
      allowNull: false
    },
    couponrate: {  
      type: Sequelize.INTEGER,  
      allowNull: false
    },
    couponinterval: {  
      type: Sequelize.INTEGER,  
      defaultValue: 0
    },
    issuedate: {
      type: Sequelize.DATE
    },
    maturitydate: {
      type: Sequelize.DATE
    },
    issuer: {
      type: Sequelize.INTEGER   // recipient id
    },
    totalsupply: {
      type: Sequelize.BIGINT
    },
    prospectusurl: {
      type: Sequelize.STRING
    },
    cashTokenID: {  
      type: Sequelize.INTEGER,  
      allowNull: false
    },
    CashTokensmartcontractaddress: {  // varchar(80)
      type: Sequelize.STRING,
      allowNull: false  
    },
    smartcontractaddress: {  // varchar(80)
      type: Sequelize.STRING  
    },
    blockchain: {
      type: Sequelize.INTEGER   // chain id
    },
    txntype: {
      type: Sequelize.INTEGER  // 0=create, 1=edit, 2=delete
    },
    approvedbondid: {
      type: Sequelize.INTEGER  // reference the id in Bond table
    },
    /*
    operator1: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    datafield1_name: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    datafield1_value: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    operator2: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    datafield2_name: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    datafield2_value: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    bool_between_fields: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    */
    status: {
      type: Sequelize.INTEGER  // 0=created, 1=submitted pending checker, 2=checked, 3=approved
    },
    name_changed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    ISIN_changed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    facevalue_changed: {  
      type: Sequelize.INTEGER,  
      defaultValue: false,
    },
    couponrate_changed: {  
      type: Sequelize.INTEGER,  
      defaultValue: false,
    },
    couponinterval_changed: {  
      type: Sequelize.INTEGER,  
      defaultValue: false,
    },
    issuedate_changed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    maturitydate_changed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    issuer_changed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    totalsupply_changed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    name_original: {
      type: Sequelize.STRING,  // varchar(45)
    },
    ISIN_original: {
      type: Sequelize.STRING,  // varchar(255)
    },
    facevalue_original: {  
      type: Sequelize.INTEGER,  
    },
    couponrate_original: {  
      type: Sequelize.INTEGER,  
    },
    couponinterval_original: {  
      type: Sequelize.INTEGER,  
    },
    issuedate_original: {
      type: Sequelize.DATE
    },
    maturitydate_original: {
      type: Sequelize.DATE
    },
    issuer_original: {
      type: Sequelize.INTEGER   // recipient id
    },
    totalsupply_original: {
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
    approvedbondid: {
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

  return Bonds_Draft;
};
