module.exports = (sequelize, Sequelize) => {
  const PBMs_Draft = sequelize.define("pbms_draft", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      unique: true,
      autoIncrement: true,
      initialAutoIncrement: 2000000000,
    },
    name: {
      type: Sequelize.STRING,  // varchar(45)
      unique: false,
      allowNull: false
    },
    description: {
      type: Sequelize.STRING,  // varchar(255)
    },
    tokenname: {
      type: Sequelize.STRING,  // varchar(45)
      allowNull: false
    },
    underlyingTokenID: {  
      type: Sequelize.INTEGER,  
      allowNull: false
    },
    underlyingDSGDsmartcontractaddress: {  // varchar(255)
      type: Sequelize.STRING,
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
    blockchain: {
      type: Sequelize.INTEGER   // chain id
    },
    txntype: {
      type: Sequelize.INTEGER  // 0=create, 1=edit, 2=delete
    },
    operator1: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    datafield1_name: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    datafield1_value: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    operator2: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    datafield2_name: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    datafield2_value: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    bool_between_fields: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    status: {
      type: Sequelize.INTEGER  // 0=created, 1=submitted pending checker, 2=checked, 3=approved
    },
    name_changed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    description_changed: {
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
    sponsor_changed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    amount_changed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    name_original: {
      type: Sequelize.STRING,  // varchar(45)
    },
    description_original: {
      type: Sequelize.STRING,  // varchar(255)
    },
    startdate_original: {
      type: Sequelize.DATE
    },
    enddate_original: {
      type: Sequelize.DATE
    },
    sponsor_original: {
      type: Sequelize.INTEGER   // recipient id
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
    approvedpbmid: {
      type: Sequelize.INTEGER  // reference the id in Pbm table
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

  return PBMs_Draft;
};
