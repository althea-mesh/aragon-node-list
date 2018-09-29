const ipfsHashes = require('./assets.js').ipfs

const financeIpfs = ipfsHashes.finance
const tokenManagerIpfs = ipfsHashes.tokenManager
const vaultIpfs = ipfsHashes.vault
const votingIpfs = ipfsHashes.voting
const altheaIpfs = ipfsHashes.althea

module.exports = async (
  truffleExecCallback,
  {artifacts = this.artifacts, verbose = true} = {}
) => {

  const log = (...args) => { if (verbose) console.log(...args) }

  log('Deploying finanance app...')
  const financeBase = await artifacts.require(
    '@aragon/apps-finance/contracts/Finance.sol'
  ).new()

  log('Deploying token manager app...')
  const tokenManagerBase = await artifacts.require(
    '@aragon/apps-token-manager/contracts/TokenManager.sol'
  ).new()

  log('Deploying vault app...')
  const vaultBase = await artifacts.require(
    '@aragon/apps-vault/contracts/Vault.sol'
  ).new()

  log('Deploying voting app...')
  const votingBase = await artifacts.require(
    '@aragon/apps-voting/contracts/Voting.sol'
  ).new()

  log('Deploying mime token app...')
  // This .sol file has multiple contracts. Specify the correct
  // contract name for this .new() to work.
  const MiniMeTokenFactory = await artifacts.require(
    '@aragon/apps-shared-minime/contracts/MiniMeToken.sol'
  )
  const minemeFact = MiniMeTokenFactory.new()

  log('Deploying althea app...')
  const altheaBase = await artifacts.require('./Althea.sol').new()

  const network = artifacts.options._values.network
  // Make sure that these addresses are correct for the corresponding network
  const {daoFactory, apm, ens} = require('./assets.js').contracts[network]

  log('Deploying AltheaDAOFactory...')
  const AltheaDAOFactory = artifacts.require('./AltheaDAOFactory.sol')
  log('aye')
  const template = await AltheaDAOFactory.new(daoFactory, minimeFac.address, apm)
  log('SUCCESS')

  await template.apmInit(
    financeBase.address,
    financeIpfs,

    tokenManagerBase.address,
    tokenManagerIpfs,

    vaultBase.address,
    vaultIpfs,

    votingBase.address,
    votingIpfs,

    altheaBase.address,
    altheaIpfs
  )
  console.log('naaah')

  const receipt = await template.createInstance()
  const daoAddr = receipt.logs.filter(l => l.event == 'DeployInstance')[0].args.dao

  const financeId = await template.financeAppId()
  const tokenManagerId = await template.tokenManagerAppId()
  const vaultId = await template.vaultAppId()
  const votingId = await template.votingAppId()
  const altheaId = await template.altheaAppId()

  const installedApps = receipt.logs.filter(l => l.event == 'InstalledApp')
  const financeAddr = installedApps.filter(e => e.args.appId == financeId)[0].args.appProxy
  const tokenManagerAddr = installedApps.filter(e => e.args.appId == tokenManagerId)[0].args.appProxy
  const vaultAddr = installedApps.filter(e => e.args.appId == vaultId)[0].args.appProxy
  const votingAddr = installedApps.filter(e => e.args.appId == votingId)[0].args.appProxy

  console.log('DAO:', daoAddr)
  console.log("DAO's finance app:", financeAddr)
  console.log("DAO's token manager app:", tokenManagerAddr)
  console.log("DAO's vault app:", vaultAddr)
  console.log("DAO's voting app:", votingAddr)

  if (typeof truffleExecCallback === 'function') {
    truffleExecCallback()
  } else {
    return { daoAddr }
  }
}