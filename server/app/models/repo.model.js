module.exports = (sequelize, Sequelize) => {
  const Repo = sequelize.define("repo", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING,  // varchar(255)
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
    nominal: {  // int 
      type: Sequelize.DOUBLE,
      allowNull: false
    },
    cleanprice: {  // float
      type: Sequelize.DOUBLE,
      allowNull: false
    },
    dirtyprice: {  // float
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
      allowNull: false  
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
    daycountconvention: {  // int
      type: Sequelize.INTEGER,
      allowNull: false
    },
    blockchain: {
      type: Sequelize.INTEGER   // chain id
    },
    status: {
      type: Sequelize.INTEGER  // 0=created pending checker, 1=checker ack, 2=approver ack
    },
    draftrepoid: {
      type: Sequelize.INTEGER   // reference the id in Repos_draft table
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

  return Repo;
};
