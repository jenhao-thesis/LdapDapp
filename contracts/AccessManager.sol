pragma solidity >=0.4.22 <0.8.0;

contract AccessManager {
    // reference: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol
    address private _owner;
    
    // struct AccessScope {
    //     bool profile;
    //     bool customData;
    // }
    
    mapping(string=>mapping(address=>mapping(address=>bool))) _accessAuthority;
    mapping(string=>bool) _oneApproved;
    
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event AccessAuthorization(address indexed owner, address indexed org);
    event AccessRevocation(address indexed owner, address indexed org);
    event ApprovedAuthorization(address indexed owner, string attr);
    event ApprovedRevocation(address indexed owner, string attr);    

    // remember to change public to internal
    constructor () public {
        address msgSender = msg.sender;
        _owner = msgSender;
        emit OwnershipTransferred(address(0), msgSender);
    }
    
    function owner() public view returns (address) {
        return _owner;
    }
    
    modifier onlyOwner() {
        require(owner() == msg.sender, "Ownable: caller is not the owner");
        _;
    }
    
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }

    function authorizeAccess(string memory attr, address target, address org) public onlyOwner {
        require(_accessAuthority[attr][target][org] == false, "The org already authorized.");
        _accessAuthority[attr][target][org] = true;   
        emit AccessAuthorization(_owner, org);
    }
    
    function revokeAccess(string memory attr, address target, address org) public onlyOwner {
        require(_accessAuthority[attr][target][org] == true, "The org don't have access right.");
        _accessAuthority[attr][target][org] = false;
        emit AccessRevocation(_owner, org);
    }
    
    function validatePermission(string memory attr, address target, address org) public view returns (bool) {
        return _accessAuthority[attr][target][org];
    }

    function authorizeAll(string memory attr) public onlyOwner {
        require(_oneApproved[attr] == false, "The attribute already approved.");
        _oneApproved[attr] = true;
        emit ApprovedAuthorization(_owner, attr);
    }

    function revokeAll(string memory attr) public onlyOwner {
        require(_oneApproved[attr] == true, "The attribute don't have right.");
        _oneApproved[attr] = false;
        emit ApprovedRevocation(_owner, attr);
    }

    function validateOneApproved(string memory attr) public view returns (bool) {
        return _oneApproved[attr];
    }
}