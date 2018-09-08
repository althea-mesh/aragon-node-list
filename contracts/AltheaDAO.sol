pragma solidity ^0.4.18;

import "@aragon/os/contracts/apps/AragonApp.sol";

import "./RenewalFeeEscrow.sol";

contract AltheaDAO is AragonApp {

  event NewMember(address indexed ethNodeAddress, bytes16 ipAddress);
  event MemberRemoved(address indexed ethNodeAddress, bytes16 ipAddress);
 
  bytes32 constant public ADD_MEMBER = keccak256("ADD_MEMBER");
  bytes32 constant public DELETE_MEMBER = keccak256("DELETE_MEMBER");

  mapping(bytes16 => address) public nodeList;

  RenewalFeeEscrow renewalFeeEscrow;

  function AltheaDAO() public {
    renewalFeeEscrow = new RenewalFeeEscrow(1*(10^10));
  }

  function addMember(address _ethAddr, bytes16 _ip) public auth(ADD_MEMBER) {
    require(nodeList[_ip] == 0x0000000000000000000000000000000000000000);
    nodeList[_ip] = _ethAddr;
    NewMember(_ethAddr, _ip);
  }

  function deleteMember(bytes16 _ip) public auth(DELETE_MEMBER) {
    MemberRemoved(nodeList[_ip], _ip);
    nodeList[_ip] = 0x0000000000000000000000000000000000000000;
  }

  function getMember(bytes16 _ip) public view returns(address addr) {
    addr = nodeList[_ip]; 
  }

  function SetBillPerBlockRate(uint _newFee) public {
    renewalFeeEscrow.setPerBlockFee(_newFee);
  }

  function getPerBlockFee() public returns(uint) {
    return renewalFeeEscrow.perBlockFee();
  }
}
