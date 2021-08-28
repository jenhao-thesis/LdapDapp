module.exports = (sequelize, Sequelize) => {
    const AccessBehavior = sequelize.define("accessBehavior", {
      identity: {
        type: Sequelize.STRING,
      },
      attribute: {
        type: Sequelize.STRING,
      },
      orgA: {
        type: Sequelize.STRING,
      },
      orgB: {
        type: Sequelize.STRING,
      },
      timestamp: {
        type: Sequelize.STRING,
      }
    });
  
    return AccessBehavior;
  };