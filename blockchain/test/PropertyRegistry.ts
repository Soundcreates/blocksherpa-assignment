import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('PropertyRegistry', function () {
  async function deployRegistry() {
    const [owner, buyer, stranger] = await ethers.getSigners();
    const registry = await ethers.deployContract('PropertyRegistry');
    await registry.waitForDeployment();
    return { registry, owner, buyer, stranger };
  }

  it('registers a property, emits an event, and exposes its details', async function () {
    const { registry, owner } = await deployRegistry();
    const propertyAddress = '221B Baker Street, London';
    const price = 125_000_000n;

    await expect(registry.registerProperty(propertyAddress, price))
      .to.emit(registry, 'PropertyRegistered')
      .withArgs(1n, propertyAddress, owner.address, price);

    const property = await registry.getProperty(1);
    expect(property.propertyAddress).to.equal(propertyAddress);
    expect(property.owner).to.equal(owner.address);
    expect(property.price).to.equal(price);
    expect(await registry.nextPropertyId()).to.equal(2n);
  });

  it('allows only the current owner to transfer ownership', async function () {
    const { registry, owner, buyer, stranger } = await deployRegistry();
    await registry.registerProperty('1 Infinite Loop, Cupertino', 1);

    await expect(registry.connect(stranger).transferOwnership(1, stranger.address))
      .to.be.revertedWithCustomError(registry, 'NotPropertyOwner')
      .withArgs(1n, stranger.address);

    await expect(registry.transferOwnership(1, buyer.address))
      .to.emit(registry, 'OwnershipTransferred')
      .withArgs(1n, owner.address, buyer.address);
    expect((await registry.getProperty(1)).owner).to.equal(buyer.address);

    await expect(registry.transferOwnership(1, owner.address))
      .to.be.revertedWithCustomError(registry, 'NotPropertyOwner')
      .withArgs(1n, owner.address);
  });

  it('rejects invalid and duplicate registrations', async function () {
    const { registry } = await deployRegistry();
    await expect(registry.registerProperty('', 1))
      .to.be.revertedWithCustomError(registry, 'InvalidPropertyAddress');
    await expect(registry.registerProperty('Somewhere', 0))
      .to.be.revertedWithCustomError(registry, 'InvalidPrice');

    await registry.registerProperty('Somewhere', 1);
    await expect(registry.registerProperty('Somewhere', 2))
      .to.be.revertedWithCustomError(registry, 'DuplicateProperty')
      .withArgs('Somewhere');
  });

  it('rejects unknown properties and the zero address as a new owner', async function () {
    const { registry, buyer } = await deployRegistry();
    await expect(registry.getProperty(99))
      .to.be.revertedWithCustomError(registry, 'PropertyNotFound')
      .withArgs(99n);

    await registry.registerProperty('Somewhere else', 1);
    await expect(registry.transferOwnership(1, ethers.ZeroAddress))
      .to.be.revertedWithCustomError(registry, 'InvalidOwner');
    await expect(registry.transferOwnership(99, buyer.address))
      .to.be.revertedWithCustomError(registry, 'PropertyNotFound')
      .withArgs(99n);
  });
});
