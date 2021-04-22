const OrganizationManager = artifacts.require("OrganizationManager");
const AccessManager = artifacts.require("AccessManager");
var status = 0;

module.exports = function(deployer) {
    deployer.deploy(OrganizationManager).then(
        ()=> console.log(OrganizationManager.address)
    );
    // deployer.deploy(AccessManager);
}