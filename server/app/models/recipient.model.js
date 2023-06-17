module.exports = (sequelize, Sequelize) => {
    const Recipient = sequelize.define("recipients", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        unique: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false  
      },
      walletaddress: {
        type: Sequelize.STRING
      },
      bank: {
        type: Sequelize.STRING
      },
      bankaccount: {
        type: Sequelize.STRING
      },
      type: {
        type: Sequelize.STRING
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
  
    return Recipient;
  };