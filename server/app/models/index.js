const config = require("../config/db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(
  config.DB,
  config.USER,
  config.PASSWORD,
  {
    host: config.HOST,
    dialect: config.dialect,
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

db.audittrail     = require("./audit_trail.model.js")(sequelize, Sequelize);

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

db.ROLES = ["user", "admin", "moderator"];

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
db.transfers_draft.belongsTo(db.campaigns, {
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


db.pbm.belongsTo(db.recipients, {
  foreignKey: "sponsor",
  targetKey: "id"
});
db.pbm_draft.belongsTo(db.recipients, {
  foreignKey: "id",
  sourceKey: "sponsor"
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



module.exports = db;
