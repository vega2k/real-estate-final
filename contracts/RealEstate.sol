pragma solidity ^0.4.25;

contract RealEstate {
    address public owner;
    address[10] public buyers;

    struct Buyer {
        address buyerAddress;
        bytes32 name;
        uint age;
    }
    mapping(uint => Buyer) public buyerInfo;
    //event 선언 (event는 블록에 저장됨) 
    event LogBuyRealEstate(
        address _buyer,
        uint _id
    );

    constructor() public {
        owner = msg.sender;
    }

    function buyRealEstate(uint _id, bytes32 _name, uint _age ) public payable {
        //유효성 체크
        require(_id >= 0 && _id <= 9);
        buyers[_id] = msg.sender;
        buyerInfo[_id] = Buyer(msg.sender, _name, _age);
        owner.transfer(msg.value);
        
        //매입자의 주소와 매물의 id를 넘겨서 이벤트 발생시킴
        emit LogBuyRealEstate(msg.sender, _id);
    }

    function getBuyerInfo(uint _id) public view returns (address, bytes32, uint) {
        Buyer memory buyer = buyerInfo[_id];
        return (buyer.buyerAddress, buyer.name, buyer.age);   
    }

    function getAllBuyers() public view returns (address[10]) {
        return buyers;
    }
}
