// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title PropertyRegistry
/// @notice A minimal on-chain registry for real-estate listing ownership.
contract PropertyRegistry {
    struct Property {
        string propertyAddress;
        address owner;
        uint256 price;
    }

    error PropertyNotFound(uint256 propertyId);
    error NotPropertyOwner(uint256 propertyId, address caller);
    error InvalidPropertyAddress();
    error InvalidOwner();
    error InvalidPrice();
    error DuplicateProperty(string propertyAddress);

    event PropertyRegistered(
        uint256 indexed propertyId,
        string propertyAddress,
        address indexed owner,
        uint256 price
    );
    event OwnershipTransferred(
        uint256 indexed propertyId,
        address indexed previousOwner,
        address indexed newOwner
    );

    uint256 public nextPropertyId = 1;
    mapping(uint256 propertyId => Property property) private properties;
    mapping(bytes32 addressHash => uint256 propertyId) public propertyIdByAddressHash;

    /// @notice Registers a unique property, assigning the caller as its owner.
    function registerProperty(string calldata propertyAddress, uint256 price)
        external
        returns (uint256 propertyId)
    {
        if (bytes(propertyAddress).length == 0) revert InvalidPropertyAddress();
        if (price == 0) revert InvalidPrice();

        bytes32 addressHash = keccak256(bytes(propertyAddress));
        if (propertyIdByAddressHash[addressHash] != 0) {
            revert DuplicateProperty(propertyAddress);
        }

        propertyId = nextPropertyId++;
        properties[propertyId] = Property({
            propertyAddress: propertyAddress,
            owner: msg.sender,
            price: price
        });
        propertyIdByAddressHash[addressHash] = propertyId;

        emit PropertyRegistered(propertyId, propertyAddress, msg.sender, price);
    }

    /// @notice Transfers a registered property. Only its current owner can call this.
    function transferOwnership(uint256 propertyId, address newOwner) external {
        Property storage property = _propertyFor(propertyId);
        if (msg.sender != property.owner) {
            revert NotPropertyOwner(propertyId, msg.sender);
        }
        if (newOwner == address(0)) revert InvalidOwner();

        address previousOwner = property.owner;
        property.owner = newOwner;
        emit OwnershipTransferred(propertyId, previousOwner, newOwner);
    }

    /// @notice Returns a property's location, owner, and listed price.
    function getProperty(uint256 propertyId)
        external
        view
        returns (string memory propertyAddress, address owner, uint256 price)
    {
        Property storage property = _propertyFor(propertyId);
        return (property.propertyAddress, property.owner, property.price);
    }

    function _propertyFor(uint256 propertyId) private view returns (Property storage property) {
        property = properties[propertyId];
        if (property.owner == address(0)) revert PropertyNotFound(propertyId);
    }
}
