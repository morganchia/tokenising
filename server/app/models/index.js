const config = require("../config/db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(
  config.DB,
  config.USER,
  config.PASSWORD,
  {
    host: config.HOST,
    dialect: config.dialect,
    dialectOptions: {
      timezone: '+00:00', // store data in +00:00 for UTC
      connectTimeout: 60000 // 60 seconds
    },
    timezone: '+08:00', // Convert retrieved dates to SGT
    logging: console.log, // Enable for debugging
    operatorsAliases: false,
    port: config.PORT,
    pool: {
      max: config.pool.max,
      min: config.pool.min,
      acquire: config.pool.acquire,
      idle: config.pool.idle
    },
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.audittrail          = require("./audit_trail.model.js")(sequelize, Sequelize);

db.user                = require("./user.model.js")(sequelize, Sequelize);
db.role                = require("./role.model.js")(sequelize, Sequelize);
db.userrole            = require("./userrole.model.js")(sequelize, Sequelize);
db.opsrole             = require("./opsrole.model.js")(sequelize, Sequelize);
db.campaigns           = require("./campaigns.model.js")(sequelize, Sequelize);
db.campaigns_draft     = require("./campaigns_draft.model.js")(sequelize, Sequelize);
db.recipients          = require("./recipients.model.js")(sequelize, Sequelize);
db.recipients_draft    = require("./recipients_draft.model.js")(sequelize, Sequelize);
db.mints               = require("./mints.model.js")(sequelize, Sequelize);
db.mints_draft         = require("./mints_draft.model.js")(sequelize, Sequelize);
db.transfers           = require("./transfers.model.js")(sequelize, Sequelize);
db.transfers_draft     = require("./transfers_draft.model.js")(sequelize, Sequelize);
db.dvp                 = require("./dvp.model.js")(sequelize, Sequelize);
db.dvp_draft           = require("./dvp_draft.model.js")(sequelize, Sequelize);
db.pbm                 = require("./pbm.model.js")(sequelize, Sequelize);
db.pbm_draft           = require("./pbm_draft.model.js")(sequelize, Sequelize);
db.pbm_templates       = require("./pbm_templates.model.js")(sequelize, Sequelize);
db.wrapmints_draft     = require("./wrapmints_draft.model.js")(sequelize, Sequelize);
db.wrapmints           = require("./wrapmints.model.js")(sequelize, Sequelize);
db.bridges             = require("./bridge.model.js")(sequelize, Sequelize);
db.bridges_draft       = require("./bridge_draft.model.js")(sequelize, Sequelize);
db.bonds               = require("./bond.model.js")(sequelize, Sequelize);
db.bonds_draft         = require("./bond_draft.model.js")(sequelize, Sequelize);
db.repos               = require("./repo.model.js")(sequelize, Sequelize);
db.repos_draft         = require("./repo_draft.model.js")(sequelize, Sequelize);
db.dtscfs              = require("./dtscfs.model.js")(sequelize, Sequelize);
db.dtscf_drafts             = require("./dtscf_drafts.model.js")(sequelize, Sequelize);
db.dtscf_contractors       = require("./dtscf_contractors.model.js")(sequelize, Sequelize);
db.dtscf_contractors_draft = require("./dtscf_contractors_draft.model.js")(sequelize, Sequelize);
db.dtscf_purchases         = require("./dtscf_purchases.model.js")(sequelize, Sequelize);
db.dtscf_purchases_draft   = require("./dtscf_purchases_draft.model.js")(sequelize, Sequelize);
db.dtscf_milestones        = require("./dtscf_milestones.model.js")(sequelize, Sequelize);
db.dtscf_milestones_draft  = require("./dtscf_milestones_draft.model.js")(sequelize, Sequelize);
db.dtscf_organisations     = require("./dtscf_organisations.model.js")(sequelize, Sequelize);


db.role.belongsToMany(db.user, {
  through: "user_roles",
  foreignKey: "roleId",
  otherKey: "userId"
});

db.user.belongsToMany(db.role, {
  through: "user_roles",
  foreignKey: "userId",
  otherKey: "roleId"
});


//db.ROLES = ["user", "moderator", "admin"]; 
db.ROLES = ["user", "moderator", "admin", "anchor", "contractor"]; // user is actually "bank" in the current implementation, but we will use "user" to avoid confusion with the "bank" role in the future when we implement the bank role.

//db.useropsrole = require("./useropsrole.model.js")(sequelize, Sequelize);
db.useropsrole =  UserOpsRole = sequelize.define("user_opsroles", {
  userId: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    references: {
      model: db.user, 
      key: 'id'
    }
  },
  opsroleId: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    references: {
      model: db.opsrole, 
      key: 'id'
    }
  },    
  transactionType: {
    type: Sequelize.STRING
  }
});

// https://sequelize.org/docs/v6/core-concepts/assocs/
db.opsrole.belongsToMany(db.user, {
  through: "user_opsroles",
  as: 'user'
//  foreignKey: "opsroleId",
//  otherKey: "userId",
});

db.user.belongsToMany(db.opsrole, {
  through: "user_opsroles",
  as: 'opsrole'
//  sourceKey: 'userId', targetKey: 'opsroleId', 
//  foreignKey: "userId",
//  otherKey: "opsroleId",
});

db.useropsrole.hasOne(db.opsrole, {
  foreignKey: "id",
  sourceKey: "opsroleId",
});

db.useropsrole.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "userId",
});


db.USEROPSROLE = ["maker", "checker", "approver"];

db.transfers.belongsTo(db.campaigns, {
  foreignKey: "campaignId",
  sourceKey: "id"
});
db.transfers.belongsTo(db.bonds, {
  foreignKey: "campaignId",
  sourceKey: "id"
});
db.transfers.belongsTo(db.pbm, {
  foreignKey: "campaignId",
  sourceKey: "id"
});
db.transfers_draft.belongsTo(db.campaigns, {
  foreignKey: "campaignId",
  sourceKey: "id"
});
db.transfers_draft.belongsTo(db.bonds, {
  foreignKey: "campaignId",
  sourceKey: "id"
});
db.transfers_draft.belongsTo(db.pbm, {
  foreignKey: "campaignId",
  sourceKey: "id"
});

db.campaigns.hasMany(db.transfers, {
  foreignKey: "campaignId",
  sourceKey: "id"
});
db.campaigns_draft.hasMany(db.transfers, {
  foreignKey: "campaignId",
  sourceKey: "id"
});


db.mints.belongsTo(db.campaigns, {
  foreignKey: "campaignId",
  sourceKey: "id"
});
db.mints_draft.belongsTo(db.campaigns, {
  foreignKey: "campaignId",
  sourceKey: "id"
});

db.campaigns.hasMany(db.mints, {
  foreignKey: "campaignId",
  sourceKey: "id"
});
db.campaigns_draft.hasMany(db.mints, {
  foreignKey: "campaignId",
  sourceKey: "id"
});

db.campaigns.hasOne(db.recipients, {
  foreignKey: "id",
  sourceKey: "sponsor"
});
db.campaigns_draft.hasOne(db.recipients, {
  foreignKey: "id",
  sourceKey: "sponsor"
});

db.campaigns.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "actionby"
});
db.campaigns_draft.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "actionby"
});

db.campaigns.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "maker"
});
db.campaigns_draft.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "maker"
});

db.campaigns.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "checker"
});
db.campaigns_draft.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "checker"
});

db.campaigns.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "approver"
});
db.campaigns_draft.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "approver"
});


db.dvp.belongsTo(db.recipients, {
  foreignKey: "counterparty1",
  targetKey: "id"
});
db.dvp.belongsTo(db.recipients, {
  foreignKey: "counterparty2",
  targetKey: "id"
});
db.dvp_draft.belongsTo(db.recipients, {
  foreignKey: "id",
  sourceKey: "counterparty1"
});
db.dvp_draft.belongsTo(db.recipients, {
  foreignKey: "id",
  sourceKey: "counterparty2"
});
db.dvp.belongsTo(db.campaigns, {
  foreignKey: "underlyingTokenID1",
  targetKey: "id",
});
db.dvp.belongsTo(db.campaigns, {
  foreignKey: "underlyingTokenID2",
  targetKey: "id",
});
db.dvp_draft.belongsTo(db.campaigns, {
  foreignKey: "id",
  sourceKey: "underlyingTokenID1"
});
db.dvp_draft.belongsTo(db.campaigns, {
  foreignKey: "id",
  sourceKey: "underlyingTokenID2"
});


db.repos.belongsTo(db.recipients, {
  foreignKey: "counterparty1",
  targetKey: "id"
});
db.repos.belongsTo(db.recipients, {
  foreignKey: "counterparty2",
  targetKey: "id"
});
db.repos_draft.belongsTo(db.recipients, {
  foreignKey: "id",
  sourceKey: "counterparty1"
});
db.repos_draft.belongsTo(db.recipients, {
  foreignKey: "id",
  sourceKey: "counterparty2"
});
db.repos.belongsTo(db.campaigns, {
  foreignKey: "underlyingTokenID1",
  targetKey: "id",
});
db.repos.belongsTo(db.campaigns, {
  foreignKey: "underlyingTokenID2",
  targetKey: "id",
});
db.repos_draft.belongsTo(db.campaigns, {
  foreignKey: "id",
  sourceKey: "underlyingTokenID1"
});
db.repos_draft.belongsTo(db.campaigns, {
  foreignKey: "id",
  sourceKey: "underlyingTokenID2"
});


db.pbm.belongsTo(db.recipients, {
  foreignKey: "sponsor",
  targetKey: "id"
});
db.pbm_draft.belongsTo(db.recipients, {
  foreignKey: "id",
  sourceKey: "sponsor"
});

db.bonds.belongsTo(db.recipients, {
  foreignKey: "issuer",
  targetKey: "id"
});
db.bonds_draft.belongsTo(db.recipients, {
  foreignKey: "issuer",
  targetKey: "id"
});
db.bonds.belongsTo(db.recipients, {
  foreignKey: "id",
  sourceKey: "sponsor"
});
db.bonds_draft.belongsTo(db.recipients, {
  foreignKey: "id",
  sourceKey: "sponsor"
});
db.bonds.belongsTo(db.campaigns, {
  foreignKey: "cashTokenID",
  targetKey: "id",
});
db.bonds_draft.belongsTo(db.campaigns, {
  foreignKey: "cashTokenID",
  targetKey: "id",
});


db.pbm_templates.belongsTo(db.recipients, {
  foreignKey: "sponsor",
  targetKey: "id"
});
db.pbm.belongsTo(db.campaigns, {
  foreignKey: "underlyingTokenID",
  targetKey: "id",
});
db.wrapmints.belongsTo(db.campaigns, {
  foreignKey: "underlyingTokenID",
  targetKey: "id",
});
db.pbm_draft.belongsTo(db.campaigns, {
  foreignKey: "id",
  sourceKey: "underlyingTokenID"
});
db.pbm_templates.belongsTo(db.campaigns, {
  foreignKey: "underlyingTokenID",
  targetKey: "id",
});
db.wrapmints_draft.belongsTo(db.campaigns, {
  foreignKey: "id",
  sourceKey: "underlyingTokenID"
});


db.bonds.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "actionby"
});
db.bonds_draft.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "actionby"
});

db.pbm.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "actionby"
});
db.wrapmints.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "actionby"
});
db.pbm_draft.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "actionby"
});
db.wrapmints_draft.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "actionby"
});

db.bonds.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "maker"
});
db.bonds_draft.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "maker"
});

db.pbm.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "maker"
});
db.wrapmints.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "maker"
});
db.pbm_draft.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "maker"
});
db.wrapmints_draft.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "maker"
});

db.bonds.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "checker"
});
db.bonds_draft.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "checker"
});

db.pbm.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "checker"
});
db.wrapmints.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "checker"
});
db.pbm_draft.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "checker"
});
db.wrapmints_draft.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "checker"
});

db.bonds.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "approver"
});
db.bonds_draft.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "approver"
});

db.pbm.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "approver"
});
db.wrapmints.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "approver"
});
db.pbm_draft.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "approver"
});
db.wrapmints_draft.hasOne(db.user, {
  foreignKey: "id",
  sourceKey: "approver"
});

// ... (other associations unchanged)

// DTSCF Relationships
db.dtscfs.hasMany(db.dtscf_milestones, {
  foreignKey: "dtscf_project_id"
});
db.dtscf_milestones.belongsTo(db.dtscfs, {
  foreignKey: "dtscf_project_id"
});

db.dtscf_drafts.hasMany(db.dtscf_milestones_draft, {
  foreignKey: "dtscf_project_id"
});
db.dtscf_milestones_draft.belongsTo(db.dtscf_drafts, {
  foreignKey: "dtscf_project_id"
});

db.dtscfs.hasMany(db.dtscf_contractors, {
  foreignKey: "dtscf_project_id"
});
db.dtscf_contractors.belongsTo(db.dtscfs, {
  foreignKey: "dtscf_project_id"
});

db.dtscf_drafts.hasMany(db.dtscf_contractors_draft, {
  foreignKey: "dtscf_project_id"
});
db.dtscf_contractors_draft.belongsTo(db.dtscf_drafts, {
  foreignKey: "dtscf_project_id"
});

db.dtscf_contractors.belongsTo(db.dtscf_contractors, {
  as: 'parent',
  foreignKey: 'dtscf_parent_contractor_id'
});
db.dtscf_contractors.hasMany(db.dtscf_contractors, {
  as: 'subcontractors',
  foreignKey: 'dtscf_parent_contractor_id'
});

db.dtscf_contractors_draft.belongsTo(db.dtscf_contractors_draft, {
  as: 'parent',
  foreignKey: 'dtscf_parent_contractor_id'
});
db.dtscf_contractors_draft.hasMany(db.dtscf_contractors_draft, {
  as: 'subcontractors',
  foreignKey: 'dtscf_parent_contractor_id'
});

db.dtscf_organisations.hasMany(db.dtscf_contractors_draft, {
  foreignKey: 'organisation_id'
});
db.dtscf_contractors_draft.belongsTo(db.dtscf_organisations, {
  foreignKey: 'organisation_id'
});
db.dtscf_organisations.hasMany(db.dtscf_contractors, {
  foreignKey: 'organisation_id'
});
db.dtscf_contractors.belongsTo(db.dtscf_organisations, {
  foreignKey: 'organisation_id'
});

db.dtscfs.hasMany(db.dtscf_purchases, {
  foreignKey: "dtscf_project_id"
});
db.dtscf_purchases.belongsTo(db.dtscfs, {
  foreignKey: "dtscf_project_id"
});

db.dtscf_drafts.hasMany(db.dtscf_purchases_draft, {
  foreignKey: "dtscf_project_id"
});
db.dtscf_purchases_draft.belongsTo(db.dtscf_drafts, {
  foreignKey: "dtscf_project_id"
});

db.dtscf_contractors.hasMany(db.dtscf_purchases, {
  foreignKey: "dtscf_contractor_id"
});
db.dtscf_purchases.belongsTo(db.dtscf_contractors, {
  foreignKey: "dtscf_contractor_id"
});

db.dtscf_contractors_draft.hasMany(db.dtscf_purchases_draft, {
  foreignKey: "dtscf_contractor_id"
});
db.dtscf_purchases_draft.belongsTo(db.dtscf_contractors_draft, {
  foreignKey: "dtscf_contractor_id"
});

db.dtscf_milestones.hasMany(db.dtscf_purchases, {
  foreignKey: "dtscf_milestone_id"
});
db.dtscf_purchases.belongsTo(db.dtscf_milestones, {
  foreignKey: "dtscf_milestone_id"
});

db.dtscf_milestones_draft.hasMany(db.dtscf_purchases_draft, {
  foreignKey: "dtscf_milestone_id"
});
db.dtscf_purchases_draft.belongsTo(db.dtscf_milestones_draft, {
  foreignKey: "dtscf_milestone_id"
});

db.dtscfs.belongsTo(db.campaigns, {
  foreignKey: "underlyingTokenID",
  targetKey: "id",
  as: "underlyingToken"
});

db.dtscf_drafts.belongsTo(db.campaigns, {
  foreignKey: "underlyingTokenID",
  targetKey: "id",
  as: "underlyingToken"
});

db.dtscfs.belongsTo(db.recipients, {
  foreignKey: "anchor_id",
  targetKey: "id",
  as: "anchor"
});

db.dtscf_drafts.belongsTo(db.recipients, {
  foreignKey: "anchor_id",
  targetKey: "id",
  as: "anchor"
});

db.user.belongsTo(db.dtscf_organisations, {
  foreignKey: "organisation_id",
  targetKey: "id",
  as: "organisation"
});

module.exports = db;
