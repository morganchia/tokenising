module.exports = (sequelize, Sequelize) => {
  const PBM_TEMPLATE = sequelize.define("pbm_templates", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    templatename: {
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

    /*
    UEN: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    SSIC: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    postalcode: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    location: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    */
    datafield1_name: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    datafield1_value: {
      type: Sequelize.STRING,
      defaultValue: null,
    },
    operator1: {
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

  return PBM_TEMPLATE;
};
