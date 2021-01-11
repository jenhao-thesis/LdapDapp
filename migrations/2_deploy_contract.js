const OrganizationManager = artifacts.require("OrganizationManager");
var status = 0;

module.exports = function(deployer) {
    deployer.deploy(OrganizationManager).then(
        ()=> console.log(OrganizationManager.address)
    );
}