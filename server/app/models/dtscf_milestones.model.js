module.exports = (sequelize, Sequelize) => {
  const Dtscf_Milestones = sequelize.define("dtscf_milestones", {
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
    budget: {
      type: Sequelize.INTEGER,  
      defaultValue: 0,
      allowNull: false
    },
    startdate: {
      type: Sequelize.DATE,
      allowNull: false
    },
    enddate: {
      type: Sequelize.DATE,
      allowNull: false
    },
    dtscf_project_id: {
      type: Sequelize.INTEGER  // reference the id in Dtscf project table
    },
    name_changed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    budget_changed: {  
      type: Sequelize.INTEGER,  
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
    budget_original: {  
      type: Sequelize.INTEGER,  
    },
    startdate_original: {
      type: Sequelize.DATE
    },
    enddate_original: {
      type: Sequelize.DATE
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

  return Dtscf_Milestones;
};
