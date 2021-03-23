module.exports = (sequelize, Sequelize) => {
    const Invoice = sequelize.define("invoice", {
      invoiceNo: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.STRING
      },
      invoiceDate: {
        type: Sequelize.STRING(6)
      },
      total: {
        type: Sequelize.INTEGER
      }
    });
  
    return Invoice;
  };