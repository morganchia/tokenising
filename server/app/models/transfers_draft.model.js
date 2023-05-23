module.exports = (sequelize, Sequelize) => {
    const Transfers = sequelize.define("transfers_draft", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        unique: true,
        autoIncrement: true
      },
      campaignId: {
        type: Sequelize.INTEGER   
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
      recipientwallet: {
        type: Sequelize.STRING,  // varchar(255)
      },
      recipientId: {
        type: Sequelize.INTEGER   // recipient id
      },
      smartcontractaddress: {
        type: Sequelize.STRING,  // varchar(255)
      },
      tokenname: {
        type: Sequelize.STRING,  // varchar(45)
      },  
      txntype: {
        type: Sequelize.INTEGER  // 0=create, 1=edit, 2=delete
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
      checkerComments: {
        type: Sequelize.STRING 
      },
      approverComments: {
        type: Sequelize.STRING 
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
  
    return Transfers;
  };
  