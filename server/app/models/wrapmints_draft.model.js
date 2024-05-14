module.exports = (sequelize, Sequelize) => {
  const wrapMints_Draft = sequelize.define("wrapmints_draft", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    underlyingTokenID: {  
      type: Sequelize.INTEGER,  
      allowNull: false
    },
    pbm_id: {  
      type: Sequelize.INTEGER,  
      allowNull: false
    },
    underlyingDSGDsmartcontractaddress: {  // varchar(255)
      type: Sequelize.STRING,
    },
    PBMsmartcontractaddress: {  // varchar(255)
      type: Sequelize.STRING,
    },
    amount: {
      type: Sequelize.BIGINT
    },
    txntype: {
      type: Sequelize.INTEGER  // 0=create, 1=edit, 2=delete
    },
    status: {
      type: Sequelize.INTEGER  // 0=created, 1=submitted pending checker, 2=checked, 3=approved
    },
    amount_changed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    amount_original: {
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
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('NOW()'),
    },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('NOW()'),
    }
  });

  return wrapMints_Draft;
};
