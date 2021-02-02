module.exports = (sequelize, Sequelize) => {
    const Nonce = sequelize.define("nonce", {
      org: {
        type: Sequelize.STRING
      },
      value: {
        type: Sequelize.STRING
      }
    });
  
    return Nonce;
  };