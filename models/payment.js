module.exports = (sequelize, Sequelize) => {
    const Payment = sequelize.define("payment", {
      Number: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      identity: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      description: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      amount :{
        type: Sequelize.STRING
      }

    });
    return Payment;
  };