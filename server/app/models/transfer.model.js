module.exports = (sequelize, Sequelize) => {
    const Transfer = sequelize.define("transfer", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        unique: true,
        autoIncrement: true
      },
      campaignId: {
        type: Sequelize.INTEGER   // recipient id
      },
      comments: {
        type: Sequelize.STRING    // varchar(255)
      },
      transferAmount: {
        type: Sequelize.DOUBLE
      },
      sourcewallet: {
        type: Sequelize.STRING,  // varchar(255)
      },
      destinationwallet: {
        type: Sequelize.STRING,  // varchar(255)
      },
      smartcontractaddress: {
        type: Sequelize.STRING,  // varchar(255)
      },
      description: {
        type: Sequelize.STRING,  // varchar(255)
      },
      tokenname: {
        type: Sequelize.STRING,  // varchar(45)
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
  
    return Transfer;
  };
  