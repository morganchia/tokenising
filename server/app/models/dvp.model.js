module.exports = (sequelize, Sequelize) => {
  const DvP = sequelize.define("dvp", {
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
    counterparty1: {  // wallet addr
      type: Sequelize.STRING,
      allowNull: false  
    },
    counterparty2: {  // wallet addr
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

  return DvP;
};
