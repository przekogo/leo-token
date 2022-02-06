import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { Token } from "../typechain/Token";

describe("Token", () => {
  let token: Token;
  const decimals = 18;
  const tokensQuantity = 100000;
  const totalSupply = BigNumber.from(
    String(tokensQuantity) + new Array(decimals).fill("0").join("")
  );
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  const exceptions = {
    zeroAddress: "Zero address not allowed",
    insufficientBalance: "Not enough tokens",
    notAllowedTransfer: "Address not allowed",
  };

  beforeEach(async () => {
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy();
    await token.deployed();
  });

  it("transfers all tokens to deployer", async () => {
    const [{ address }] = await ethers.getSigners();

    const balance = await token.balanceOf(address);
    expect(balance.eq(totalSupply)).to.equal(true);
  });

  it("transfers tokens with transfer method and emits Transfer event", async () => {
    const [{ address: senderAddress }, { address: receiverAddress }] =
      await ethers.getSigners();
    expect(await token.transfer(receiverAddress, 10))
      .to.emit(token, "Transfer")
      .withArgs(senderAddress, receiverAddress, 10);
    const senderBalance = await token.balanceOf(senderAddress);

    expect(senderBalance.eq(totalSupply.sub(10))).to.equal(true);
    expect(await token.balanceOf(receiverAddress)).to.equal(10);
  });

  it("throws an exception when zero adress", async () => {
    await expect(token.transfer(zeroAddress, 10)).to.be.revertedWith(
      exceptions.zeroAddress
    );

    const [{ address: senderAddress }] = await ethers.getSigners();
    const senderBalance = await token.balanceOf(senderAddress);
    expect(senderBalance.eq(totalSupply)).to.equal(true);
  });

  it("throws an exception when balance not high enough", async () => {
    const [_, zeroBalanceSender, { address: receiverAddress }] =
      await ethers.getSigners();

    await expect(
      token.connect(zeroBalanceSender).transfer(receiverAddress, 10)
    ).to.be.revertedWith(exceptions.insufficientBalance);

    expect(await token.balanceOf(receiverAddress)).to.equal(0);
  });
});
