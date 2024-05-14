module.exports = (sequelize, Sequelize) => {
    const Mint = sequelize.define("mint", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        unique: true,
        autoIncrement: true
      },
      campaignId: {
        type: Sequelize.INTEGER   // recipient id
      },
      blockchain: {
        type: Sequelize.INTEGER  // chain id
      },
      comments: {
        type: Sequelize.STRING    // varchar(255)
      },
      mintAmount: {
        type: Sequelize.DOUBLE
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
  
    return Mint;
  };
  