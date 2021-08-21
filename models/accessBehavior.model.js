module.exports = (sequelize, Sequelize) => {
    const AccessBehavior = sequelize.define("accessBehavior", {
      identity: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      attribute: {
        type: Sequelize.STRING,
      },
      orgA: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      orgB: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      timestamp: {
        type: Sequelize.STRING,
      }
    });
  
    return AccessBehavior;
  };