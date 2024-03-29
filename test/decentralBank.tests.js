const Tether = artifacts.require("Tether");
const RWD = artifacts.require("RWD");
const DecentralBank = artifacts.require("DecentralBank");

require("chai")
  .use(require("chai-as-promised"))
  .should();

contract("DecentralBank", ([owner, customer]) => {
  // all code here for testing

  let tether, rwd, decentralBank;

  const tokens = (number) => web3.utils.toWei(number, "ether");

  before(async () => {
    // we want tether to deploy the contract
    tether = await Tether.new(); // will get instance of everything from Tether
    rwd = await RWD.new();
    decentralBank = await DecentralBank.new(rwd.address, tether.address);

    // check if all reward toekn is tranferred to decentral bank
    // transfer all tokens to decental bank
    await rwd.transfer(decentralBank.address, tokens("1000000"));

    // transfer 100 mocker tether to customer
    await tether.transfer(customer, tokens("100"), { from: owner });
  });

  describe("Mock Tether Deployment", async () => {
    it("matches name successfully", async () => {
      const name = await tether.name();
      assert.equal(name, "Mock Tether Token");
    });
  });

  describe("Reward Token Deployment", async () => {
    it("matches name successfully", async () => {
      const name = await rwd.name();
      assert.equal(name, "Reward Token");
    });
  });

  describe("Decentral Bank Deployment", async () => {
    it("matches name successfully", async () => {
      const name = await decentralBank.name();
      assert.equal(name, "Decentral Bank");
    });

    it("contract has token", async () => {
      const balance = await rwd.balanceOf(decentralBank.address);
      assert.equal(balance, tokens("1000000"));
    });
  });

  describe("Yield Farming", async () => {
    it("reward token for staking", async () => {
      // check investor balance
      let result = await tether.balanceOf(customer);

      assert.equal(
        result.toString(),
        tokens("100"),
        "Customer mock tether balance before staking"
      );

      // check staking for customer of 100
      await tether.approve(decentralBank.address, tokens("100"), {
        from: customer,
      });
      await decentralBank.depositTokens(tokens("100"), {
        from: customer,
      });

      // check updated balance of customer
      result = await tether.balanceOf(customer);

      assert.equal(
        result.toString(),
        tokens("0"),
        "Customer mock tether balance after staking 100 tokens"
      );

      // check updated balance of decentral bank
      result = await tether.balanceOf(decentralBank.address);

      assert.equal(
        result.toString(),
        tokens("100"),
        "Decentral bank mock tether balance after staking from customer"
      );

      // is staking balance
      result = await decentralBank.isStaking(customer);

      assert.equal(
        result.toString(),
        "true",
        "customer is staking status after staking"
      );

      // issue token
      await decentralBank.issueTokens({ from: owner });

      // ensure only the owner can issue tokens
      await decentralBank.issueTokens({ from: customer }).should.be.rejected;

      // unstake tokens
      await decentralBank.unstakeTokens({ from: customer });

      // check unstaking balance
      result = await tether.balanceOf(customer);

      assert.equal(
        result.toString(),
        tokens("100"),
        "Customer mock tether balance after unstaking 100 tokens"
      );

      // check updated balance of decentral bank
      result = await tether.balanceOf(decentralBank.address);

      assert.equal(
        result.toString(),
        tokens("0"),
        "Decentral bank mock tether balance after unstaking from customer"
      );

      // is staking update
      result = await decentralBank.isStaking(customer);

      assert.equal(
        result.toString(),
        "false",
        "customer is staking status after unstaking"
      );
    });
  });
});
