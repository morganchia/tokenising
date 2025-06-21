module.exports = (sequelize, Sequelize) => {
  const Repos_Draft = sequelize.define("repos_draft", {
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
    },    
    tradedate: {
      type: Sequelize.DATE,
      allowNull: false
    },
    startdatetime: {
      type: Sequelize.DATE,
      allowNull: false
    },
    enddatetime: {
      type: Sequelize.DATE,
      allowNull: false
    },
    bondisin: {  // varchar(45)
      type: Sequelize.STRING,
      allowNull: false
    },
    securityLB: {  // varchar(5)
      type: Sequelize.STRING,
      allowNull: false
    },
    nominal: {  // double 
      type: Sequelize.DOUBLE,
      allowNull: false
    },
    cleanprice: {  // double
      type: Sequelize.DOUBLE,
      allowNull: false
    },
    dirtyprice: {  // double
      type: Sequelize.FLOAT,
      allowNull: false
    },
    haircut: {  // float
      type: Sequelize.FLOAT,
      allowNull: false
    },
    startamount: {  // double
      type: Sequelize.DOUBLE,
      allowNull: false
    },
    currency: {  // varchar(5)
      type: Sequelize.STRING,
      allowNull: false
    },
    reporate: {  // float
      type: Sequelize.FLOAT,
      allowNull: false
    },
    interestamount: {  // double
      type: Sequelize.DOUBLE,
      allowNull: false
    },
    daycountconvention: {  // int
      type: Sequelize.INTEGER,
      allowNull: false
    },
    counterpartyname: {  
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
      type: Sequelize.DOUBLE,
      allowNull: false
    },
    amount2: {
      type: Sequelize.DOUBLE,
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
    approvedrepoid: {
      type: Sequelize.INTEGER  // reference the id in Repo table
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

  return Repos_Draft;
};
