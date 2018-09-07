const RenewalFeeEscrow = artifacts.require('./RenewalFeeEscrow.sol')
RenewalFeeEscrow.numberFormat = 'BN'
const BN = web3.utils.BN

require('chai').should()

const expectEvent = require('./helpers/expectEvent.js')
const { assertRevert } = require('./helpers/assertRevert.js')
const { summation } = require('./helpers/summation.js')

contract('RenewalFeeEscrow', (accounts) => {

  let subnetDAO = accounts[accounts.length-1]
  let contract

  describe('addBill', async () => {

    beforeEach(async () => {
      contract = await RenewalFeeEscrow.new({from: subnetDAO})
    })

    it('Revert when no value is sent', async () => {
      assertRevert(contract.addBill())
    })

    it('Adds a new bill to mapping', async () => {

      const receipt = await contract.addBill({value: 1*(10**10)})
      const event = await expectEvent.inLogs(receipt.logs, 'NewBill', { 
        payer: accounts[0],
        collector: subnetDAO
      })
      event.args.payer.should.eql(accounts[0])
      event.args.collector.should.eql(subnetDAO)
    })

    it('Will not replace an exsting bill', async () => {
      await contract.addBill({value: 1*(10**10)})
      assertRevert(contract.addBill({value: 2*(10**10)}))
    })

    it('Contract ether balance should increase', async () => {
      let balance = 1*(10**10)
      await contract.addBill({value: balance})

      let contractBalance = await web3.eth.getBalance(contract.address)
      contractBalance.should.eql(web3.utils.toBN(balance).toString())

    })
  })


  describe('getCountOfSubscribers', async () => {

    let min = Math.ceil(7)
    let max = Math.floor(2)
    let subnetDAOUsers = Math.floor(Math.random() * (max - min)) + min

    beforeEach(async () => {
      contract = await RenewalFeeEscrow.new({from: subnetDAO})
    })

    it('Should have the right length', async () => {
      for (let i = 0; i < subnetDAOUsers; i++) {
        await contract.addBill({from: accounts[i], value: 1*(10**10)})
      }
      let subscribers = await contract.getCountOfSubscribers()
      subscribers.toNumber().should.eql(subnetDAOUsers)
    })

  })

  describe('topOffBill', async () => {
    beforeEach(async () => {
      contract = await RenewalFeeEscrow.new({from: subnetDAO})
    })

    it('Revert when value is zero', async () => {
      await contract.addBill({value: 1*(10**10)})
      assertRevert(contract.topOffBill())
    })

    it('Revert if bill does not exist', async () => {
      await contract.addBill({value: 1*(10**10)})
      assertRevert(contract.topOffBill({from: accounts[1], value: 1*(10**10)}))
    })

    it('Inccrease bill by corresponding amount', async () => {
      let account =  1*(10**10)
      await contract.addBill({value: account})
      await contract.topOffBill({value: account})

      let total = new BN(account*2)

      let bill = await contract.billMapping(accounts[0])
      assert(bill.account.eq(total))
    })

  })

  describe('collectBills', async () => {

    beforeEach(async () => {
      contract = await RenewalFeeEscrow.new({from: subnetDAO})
    })

    it('Revert when caller is not subnetDAO', async () => {
      await contract.addBill({value: 1*(10**18)})
			assertRevert(contract.collectBills({from: accounts[3]}))
    })

    it('Bill lastUpdated should equal current block number', async () => {
      
      await contract.addBill({value: 1*(10**18)})

      await contract.collectBills({from: subnetDAO})
      let bill = await contract.billMapping(accounts[0])
      let blockNumber = new BN(await web3.eth.getBlockNumber())
      bill.lastUpdated.toString().should.eql(blockNumber.toString())

    })

    it('Subnet should have an expected balance for single account', async () => {

      await contract.addBill({value: 1*(10**18)})
      
      let previousBalance = new BN(await web3.eth.getBalance(subnetDAO))
      let bill = await contract.billMapping(accounts[0])

      const txn = await contract.collectBills({from: subnetDAO})

      let txnCost = txn.receipt.gasUsed*(await web3.eth.getGasPrice())
      txnCost = new BN(txnCost)

      // this block number needs to be after the collectSubetFees call
      let blockDelta = new BN(await web3.eth.getBlockNumber()).sub(bill.lastUpdated)
      let expectedRevenue = bill.perBlock.mul(blockDelta)
      let expectedNewBalance = expectedRevenue.add(previousBalance).sub(txnCost)

      new BN(await web3.eth.getBalance(subnetDAO))
        .eq(expectedNewBalance).should.eql(true)
    })

    it('Collect from multiple bills', async () => {

      let accountOne = 1*(10**17)
      let perBlockFee = 1*(10**15)
      let subscribersCount = 6
      for (var i = 0; i < subscribersCount; i++) {
        await contract.addBill({from: accounts[i], value: accountOne})
      }

      let previousBalance = new BN(await web3.eth.getBalance(subnetDAO))

      const txn = await contract.collectBills({from: subnetDAO})

      const txnCost = new BN(txn.receipt.gasUsed*(await web3.eth.getGasPrice()))
      const billCount = new BN(summation(subscribersCount))
      let expectedNewBalance = new BN(perBlockFee).mul(billCount)
        .add(previousBalance).sub(txnCost)

      console.log('Expted Balance ', expectedNewBalance.toString())
      let balance = new BN(await web3.eth.getBalance(subnetDAO))
      console.log('Current Balance', balance.toString())

      balance.eq(expectedNewBalance).should.eql(true)
    })

    it('Set bill account to zero', async () => {

      let accountOne = 2*(10**10)
      let perBlockFee = 1*(10**10)
      await contract.addBill({value: accountOne})

      // extra txns to run up the counter
      for (var i = 0; i < 4; i++) {
        await  web3.eth.sendTransaction({
          from: accounts[1],
          to: '0x0000000000000000000000000000000000000000',
          value: 1
        })
      }

      await contract.collectBills({from: subnetDAO})
      let bill = await contract.billMapping(accounts[0])

    })
  })

  describe('payMyBills', async () => {

    beforeEach(async() => {
      contract = await RenewalFeeEscrow.new({from: subnetDAO})
    })

    it('Bill should have lastUpdated with same blockNumber', async () => {
      let accountOne = 1*(10**10)
      let perBlockFee = 1*(10**9)
      await contract.addBill({value: accountOne})
      await contract.payMyBills()
      let bill = await contract.billMapping(accounts[0])

      assert(bill.lastUpdated.eq(new BN(await web3.eth.getBlockNumber())))
    })

    it('Collectors should have increased balance', async () => {
      let accountOne = 1*(10**10)
      let perBlockFee = 1*(10**9)
      await contract.addBill({value: accountOne})

      // extra txns to run up the counter
      let blockCount = 5
      for (var i = 0; i < blockCount; i++) {
        await  web3.eth.sendTransaction({
          from: accounts[1],
          to: '0x0000000000000000000000000000000000000000',
          value: 1
        })
      }

      let previousBalance = new BN(await web3.eth.getBalance(subnetDAO))
      // the +1 is for the payMyBills txn block number
      let expectedNewBalance = new BN(perBlockFee).mul(new BN(blockCount + 1))
      // the i prefix is for inplace
      expectedNewBalance.iadd(previousBalance)
      await contract.payMyBills()
      new BN(await web3.eth.getBalance(subnetDAO)).eq(expectedNewBalance).should.eql(true)
    })

    it('Account of bill should be zero when it cant afford payment', async () => {

      let accountOne = 2*(10**10)
      let perBlockFee = 1*(10**10)
      await contract.addBill({value: accountOne})

      // extra txns to run up the counter
      for (var i = 0; i < 4; i++) {
        await  web3.eth.sendTransaction({
          from: accounts[1],
          to: '0x0000000000000000000000000000000000000000',
          value: 1
        })
      }

      await contract.payMyBills()
      let bill = await contract.billMapping(accounts[0])
      bill.account.toString().should.eql('0')

    })
  })

  describe('withdrawFromBill', async () => {

    beforeEach(async() => {
      contract = await RenewalFeeEscrow.new({from: subnetDAO})
    })

    it('Increases the balance of the subscriber', async () => {
      let accountOne = 1*(10**10)
      let perBlockFee = 1*(10**9)

      await contract.addBill({from: accounts[1], value: accountOne})


      const blockCount = 5
      // extra txns to run up the counter
      for (var i = 0; i < blockCount; i++) {
        await  web3.eth.sendTransaction({
          from: accounts[1],
          to: '0x0000000000000000000000000000000000000000',
          value: 1
        })
      }
      const oldBalance = new BN(await web3.eth.getBalance(accounts[1]))

      const txn = await contract.withdrawFromBill({from: accounts[1]})
      let txnCost = new BN(txn.receipt.gasUsed*(await web3.eth.getGasPrice()))

      let leftOverAccount = new BN(accountOne - perBlockFee*summation(blockCount))
      let expectedNewBalance = leftOverAccount.add(oldBalance).sub(txnCost)
      expectedNewBalance.toString().should.eql(await web3.eth.getBalance(accounts[1]))
    })
    
    it('It reverts (saves gas) when the account has 0', async () => {
      let accountOne = 1*(10**10)
      let perBlockFee = 1*(10**9)

      await contract.addBill({from: accounts[1], value: accountOne})

      // extra txns to run up the counter
      for (var i = 0; i < 10; i++) {
        await  web3.eth.sendTransaction({
          from: accounts[1],
          to: '0x0000000000000000000000000000000000000000',
          value: 1
        })
      }
      assertRevert(contract.withdrawFromBill({from: accounts[1]}))
    })
  })

})
