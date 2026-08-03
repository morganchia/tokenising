module.exports = (sequelize, Sequelize) => {
  const CrossChainDvP = sequelize.define("crosschaindvps", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING,  // varchar(255)
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
    counterpartyname: {
      type: Sequelize.STRING,
      allowNull: false
    },
    counterparty1: {  // wallet addr, chain 1 (blockchain)
      type: Sequelize.STRING,
      allowNull: false
    },
    counterparty2: {  // wallet addr, chain 2 (blockchain2)
      type: Sequelize.STRING,
      allowNull: false
    },
    underlyingTokenID1: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    underlyingTokenID2: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    smartcontractaddress1: {  // TokenA ERC20 address, on `blockchain`
      type: Sequelize.STRING,
      allowNull: false
    },
    smartcontractaddress2: {  // TokenB ERC20 address, on `blockchain2`
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
      type: Sequelize.INTEGER   // chain id for counterparty1 / TokenA
    },
    blockchain2: {
      type: Sequelize.INTEGER   // chain id for counterparty2 / TokenB
    },
    status: {
      type: Sequelize.INTEGER  // 0=created pending checker, 1=checker ack, 2=approver ack
    },
    startlegstatus: {
      type: Sequelize.INTEGER,  // 0=not locked, 1=locked both chains, 2=released both chains
      defaultValue: 0,
    },
    maturitylegstatus: {
      type: Sequelize.INTEGER,  // 0=not locked, 1=locked both chains, 2=released both chains
      defaultValue: 0,
    },
    draftcrosschaindvpid: {
      type: Sequelize.INTEGER   // reference the id in CrossChainDvP_Draft table
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

  return CrossChainDvP;
};
