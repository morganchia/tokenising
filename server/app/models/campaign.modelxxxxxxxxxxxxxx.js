module.exports = (sequelize, Sequelize) => {
  const Campaign = sequelize.define("campaign", {
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
    tokenname: {
      type: Sequelize.STRING,  // varchar(45)
      allowNull: false
    },
    smartcontractaddress: {  // varchar(255)
      type: Sequelize.STRING  
    },
    startdate: {
      type: Sequelize.DATE
    },
    enddate: {
      type: Sequelize.DATE
    },
    sponsor: {
      type: Sequelize.INTEGER   // recipient id
    },
    amount: {
      type: Sequelize.BIGINT
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

  return Campaign;
};
