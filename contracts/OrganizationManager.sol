// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;
import "./AccessManager.sol";

contract OrganizationManager {
    constructor() public {
         for (uint i = 0; i < _orgsArr.length; i++) {
             _orgs[_orgsArr[i]] = true;
         }
    }
    
    function() external {
        // fallback function
    }
    
    struct UserInfo {
        address lastModifyOrg;          // [org2.id]
        address accessManagerAddress;   // address of access control manager
        address userAddress;            // binding addrss
        mapping(address => bool) orgs;  // [org1.id, org2.id]
    }
    
    // Pre-registered organization
    address[] _orgsArr = [0x1F7F0f7Be634D340EB070f3f3C21b6cE4ab857BD, 
                            0xA3e898C280220bf5fAE9e7e6ceB4F3a6BFa67163,
                            0x18db34baE039C54aA2B56BDF59ff380d29BffeD7,
                            0xF799b4462423B551cF404a3688C03051A2BE7359,
                            0x8423B7478160163c6e3319E64a6Ad4B77dfb7015];
    
    // Permission of user and organization
    mapping (address => bool) _orgs;
    mapping(address => bool) _users;
    
    //     
    mapping(address => bytes32) _bindUsers;
    mapping(bytes32 => bool) _uniqueState;
    mapping(bytes32 => bool) _bindState;
    mapping(bytes32 => UserInfo) _uniqueIdenity;
    
    // Events
    event AddUserEvent(address orgAddress, uint status);
    event BindUserAccountEvent(address orgAddress, address userAccount, bytes32 hashed);

    uint256 _state;
    
    modifier onlyOrg {
        require(_orgs[msg.sender],
                "Only organization administrator can call.");
        _;
    }

    modifier onlyUser {
        require(_users[msg.sender],
                "Only registered user can call.");
        _;
    }
    
    function addUser(
        string memory uniqueId
    )
        public onlyOrg
    {
        bytes32 hashed = keccak256(bytes(uniqueId));
        if (_uniqueState[hashed]) {
            // alreay exist and add org
            _uniqueIdenity[hashed].orgs[msg.sender] = true;
            _uniqueIdenity[hashed].lastModifyOrg = msg.sender;
            emit AddUserEvent(msg.sender, 0);
        }
        else {
            _uniqueState[hashed] = true;
            UserInfo memory info = UserInfo(
                                        msg.sender,
                                        address(0),
                                        address(0)
                                    );
            _uniqueIdenity[hashed] = info;
            _uniqueIdenity[hashed].orgs[msg.sender] = true;
            emit AddUserEvent(msg.sender, 1);
        }
    }

    // bind user identity(hash of ID card number) with ethereum account
    function bindAccount(
        string memory uniqueId,
        address userAddress
    )
        public onlyOrg
    {
        require(_bindUsers[userAddress] == 0,
                "This address already binded.");
        require(_bindState[keccak256(bytes(uniqueId))] == false,
                "This UniqueId already binded");
        require(_uniqueState[keccak256(bytes(uniqueId))],
                "UniqueId invalid.");
        bytes32 hashed = keccak256(bytes(uniqueId));

        _bindUsers[userAddress] = hashed;    // for record address <==> hashed id
        _bindState[hashed] = true;           // for confirm this hashed id already bind before
        _users[userAddress] = true;          // for modifier onlyUser

        // create contract and transfer ownership to user himself
        AccessManager accessManager = new AccessManager();
        accessManager.transferOwnership(userAddress);
        
        // update user info
        _uniqueIdenity[hashed].accessManagerAddress = address(accessManager);
        _uniqueIdenity[hashed].userAddress = userAddress;
        
        emit BindUserAccountEvent(msg.sender, userAddress, hashed);
    }

    function checkLastModify(string memory uniqueId) public view returns (address){
        return (_uniqueIdenity[keccak256(bytes(uniqueId))]).lastModifyOrg;
    }
        
    function checkOrgs(string memory uniqueId) public view returns (bool) {
        return _uniqueIdenity[keccak256(bytes(uniqueId))].orgs[msg.sender];
    }
    
    function getIdentity(string memory userId) public view returns (string memory) {
        // if (keccak256(bytes(_userOrgMap[userId])) == keccak256(bytes(""))) return "Not found";
        // return _userOrgMap[userId];
    }
    
    function getOrg(uint idx) public onlyOrg view returns (address) {
        if (idx >= _orgsArr.length) return address(0);
        return _orgsArr[idx];
    }
    
    // Get hashed id by plaintext id number
    function getId(string memory uniqueId) public onlyOrg view returns (bytes32) {
        bytes32 hashed = keccak256(bytes(uniqueId));
        if (_uniqueState[hashed]) return hashed;
        return 0;
    }
    
    // Get hashed id by etherenum address(msg.sender)
    function getId() public view returns (bytes32) {
        return _bindUsers[msg.sender];
    }

    // Get address by unique id
    function getAddress(string memory uniqueId) public onlyOrg view returns (address) {
        bytes32 hashed = keccak256(bytes(uniqueId));
        return _uniqueIdenity[hashed].userAddress;
    }

    // Get address by unique id
    function getAddressByHashed(bytes32 hashed) public onlyOrg view returns (address) {
        return _uniqueIdenity[hashed].userAddress;
    }

    // Get hashed id by orgs
    function getIdByOrg(address userAddress) public onlyOrg view returns (bytes32) {
        return _bindUsers[userAddress];
    } 

    // Get Org list by anyone
    function getOrgList() public view returns (address [] memory) {
        return _orgsArr;
    }

    // Get Contract address by UserManager
    function getAccessManagerAddress(address userAddress) public view returns (address) {
        return _uniqueIdenity[_bindUsers[userAddress]].accessManagerAddress;
    }
}


// contract UserManager {
//     // TODO
// }


// contract LogManager {
//     // TODO
// }


// contract AccessManager {
//     // TODO
// }