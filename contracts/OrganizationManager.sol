// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;

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
        mapping(address => bool) orgs;  // [org1.id, org2.id]
    }
    
    // Pre-registered organization
    address[] _orgsArr = [0x56B1817fFa1Ff86ebB922400155CD3bE3F734419, 
                            0x8519B08add5a70A1fE164554EB5FCca0a9610b2e,
                            0x411Dd550079Bb53221E11Ad59313e2AcB85B0f29,
                            0x7e71751dBe4a5054EFd00Dd52E71b60608731466,
                            0x42adAE49621887c8F455dF841d55e88587E8DE1A];
    
    // Permission of user and organization
    mapping (address => bool) _orgs;
    mapping(address => bool) _users;
    
    //     
    mapping(address => bytes32) _bindUsers;
    mapping(bytes32 => bool) _uniqueState;
    mapping(bytes32 => UserInfo) _uniqueIdenity;
    

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
        public onlyOrg returns (bool)
    {
        bytes32 hashed = keccak256(bytes(uniqueId));
        if (_uniqueState[hashed]) {
            // alreay exist and add org
            _uniqueIdenity[hashed].orgs[msg.sender] = true;
            _uniqueIdenity[hashed].lastModifyOrg = msg.sender;
            return false;
        }
        else {
            _uniqueState[hashed] = true;
            UserInfo memory info = UserInfo(
                                        msg.sender
                                    );
            _uniqueIdenity[hashed] = info;
            _uniqueIdenity[hashed].orgs[msg.sender] = true;
            return true;
        }
    }
        
    // function enroll(
    //     string memory userId,
    //     string memory orgId
    // )
    //     public onlyOrg returns (uint)
    // {
    //     // if (keccak256(bytes(_userOrgMap[userId])) != keccak256(bytes(""))) {
    //     //     return 0;
    //     // }
    //     // else {
    //     //     _userOrgMap[userId] = orgId;    
    //     // }
    //     return 1;
    // }
    
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
    
    function getId(string memory uniqueId) public view returns (bytes32) {
        bytes32 hashed = keccak256(bytes(uniqueId));
        if (_uniqueState[hashed]) return hashed;
        return 0;
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