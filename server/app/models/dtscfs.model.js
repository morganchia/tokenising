module.exports = (sequelize, Sequelize) => {
  const Dtscfs = sequelize.define("dtscfs", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      unique: true,
      autoIncrement: true,
      initialAutoIncrement: 1,
    },
    name: {
      type: Sequelize.STRING,  // varchar(50)
      unique: false,
      allowNull: false
    },
    description: {
      type: Sequelize.STRING,  // varchar(45)
      allowNull: true
    },
    anchor_id: {
      type: Sequelize.INTEGER,  
      defaultValue: 0,
      allowNull: false
    },
    totalBudget: {
      type: Sequelize.INTEGER,  
      defaultValue: 0,
      allowNull: false
    },
    underlyingTokenID: {
      type: Sequelize.INTEGER,  
      allowNull: false
    },
    underlyingDSGDsmartcontractaddress: {
      type: Sequelize.STRING,  // varchar(255)
      allowNull: false
    },
    smartcontractaddress: {
      type: Sequelize.STRING  // varchar(255)
    },
    campaign_id: {
      type: Sequelize.INTEGER
    },
    blockchain: {
      type: Sequelize.INTEGER   // chain id
    },
    startdate: {
      type: Sequelize.DATE,
      allowNull: false
    },
    enddate: {
      type: Sequelize.DATE,
      allowNull: false
    },
    txntype: {
      type: Sequelize.INTEGER  // 0=create, 1=edit, 2=delete
    },
    status: {
      type: Sequelize.INTEGER  // 0=created, 1=submitted pending checker, 2=checked, 3=approved
    },
    draftdtscfid: {
      type: Sequelize.INTEGER   // reference the id in Dtscf_draft table
    },
    dbstatus:{
      type: Sequelize.STRING,  // "PENDING", "APPROVED", "REJECTED"
    },
    name_changed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    description_changed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    totalBudget_changed: {  
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
    name_original: {
      type: Sequelize.STRING,  // varchar(50)
    },
    description_original: {
      type: Sequelize.STRING,  // varchar(255)
    },
    totalBudget_original: {  
      type: Sequelize.INTEGER,  
    },
    startdate_original: {
      type: Sequelize.DATE
    },
    enddate_original: {
      type: Sequelize.DATE
    },
    anchor_token_salt: {
      type: Sequelize.STRING,  // hex-encoded 32-byte salt for the anchor's initial wrap token commitment
      allowNull: true
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

  return Dtscfs;
};
