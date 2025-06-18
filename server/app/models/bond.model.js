module.exports = (sequelize, Sequelize) => {
  const Bond = sequelize.define("bond", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      unique: true,
      autoIncrement: true,
      initialAutoIncrement: 2000000000,
    },
    name: {
      type: Sequelize.STRING,  // varchar(255)
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
    couponinterval: {  
      type: Sequelize.INTEGER,  
      defaultValue: 0
    },
    couponrate: {  
      type: Sequelize.INTEGER,  
      allowNull: false
    },
    facevalue: {  
      type: Sequelize.INTEGER,  
      allowNull: false
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
    CashTokensmartcontractaddress: {  // varchar(255)
      type: Sequelize.STRING,
      allowNull: false  
    },
    smartcontractaddress: {  // varchar(255)
      type: Sequelize.STRING  
    },
    blockchain: {
      type: Sequelize.INTEGER   // chain id
    },
    draftbondid: {
      type: Sequelize.INTEGER   // reference the id in Bond_draft table
    },
    status: {
      type: Sequelize.INTEGER  // 0=created pending checker, 1=checker ack, 2=approver ack
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
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('NOW()'),
    },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('NOW()'),
    }
  });

  return Bond;
};
