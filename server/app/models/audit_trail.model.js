module.exports = (sequelize, Sequelize) => {
    const AuditTrails = sequelize.define("audittrails", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      timestamp: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
      action: {
        type: Sequelize.STRING
      },
      campaignId: {
        type: Sequelize.INTEGER  // reference the id in Campaigns table
      },
      mintId: {
        type: Sequelize.INTEGER  // reference the id in Mints table
      },
      transferId: {
        type: Sequelize.INTEGER  // reference the id in Transfers table
      },
      draftcampaignId: {
        type: Sequelize.INTEGER  // reference the id in draft Campigns table
      },
      draftmintId: {
        type: Sequelize.INTEGER  // reference the id in draft Mints table
      },
      drafttransferId: {
        type: Sequelize.INTEGER  // reference the id in draft Transfers table
      },
      name: {
        type: Sequelize.STRING,  // varchar(45)
      },
      description: {
        type: Sequelize.STRING,  // varchar(255)
      },
      blockchain: {
        type: Sequelize.INTEGER   // chain id
      },
      tokenname: {
        type: Sequelize.STRING,  // varchar(45)
      },
      amount: {
        type: Sequelize.BIGINT
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
      bank : {  // varchar(255)
        type: Sequelize.STRING  
      },
      bankaccount : {  // varchar(255)
        type: Sequelize.STRING  
      },
      sourcewallet : {  // varchar(255)
        type: Sequelize.STRING  
      },
      recipientwallet : {  // varchar(255)
        type: Sequelize.STRING  
      },
      smartcontractaddress: {  // varchar(255)
        type: Sequelize.STRING  
      },
      PBMunderlyingDSGDsmartcontractaddress: {  // varchar(255)
        type: Sequelize.STRING  
      },
      PBMunderlyingTokenID: {  
        type: Sequelize.INTEGER
      },
      underlyingTokenID1: {  
        type: Sequelize.INTEGER
      },
      underlyingTokenID2: {  
        type: Sequelize.INTEGER
      },
      smartcontractaddress1: {  // varchar(255)
        type: Sequelize.STRING  
      },
      smartcontractaddress2: {  // varchar(255)
        type: Sequelize.STRING  
      },
      counterparty1: {  // varchar(255)
        type: Sequelize.STRING  
      },
      counterparty2: {  // varchar(255)
        type: Sequelize.STRING  
      },
      amount1: {
        type: Sequelize.BIGINT
      },
      amount2: {
        type: Sequelize.BIGINT
      },
      status: {
        type: Sequelize.INTEGER  // 0=created, 1=submitted pending checker, 2=checked, 3=approved
      },
      txntype: {
        type: Sequelize.INTEGER  // 0=create, 1=edit, 2=delete
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
      actionby: {
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
  
    return AuditTrails;
  };
  