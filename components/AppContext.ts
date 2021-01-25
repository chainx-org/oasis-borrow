import { call, createSend, SendFunction } from '@oasisdex/transactions'
import { createWeb3Context$ } from '@oasisdex/web3-context'
import { BigNumber } from 'bignumber.js'
import {
  createSendTransaction,
  createSendWithGasConstraints,
  estimateGas,
  EstimateGasFunction,
  SendTransactionFunction,
  TransactionDef,
} from 'components/blockchain/calls/callsHelpers'
import {
  cdpManagerIlks,
  cdpManagerOwner,
  cdpManagerUrns,
} from 'components/blockchain/calls/cdpManager'
import { createProxyAddress$, createProxyOwner$ } from 'components/blockchain/calls/proxy'
import { Urn, vatGem, vatIlks, vatUrns } from 'components/blockchain/calls/vat'
import { createGasPrice$ } from 'components/blockchain/gas'
import { createReadonlyAccount$ } from 'components/connectWallet/readonlyAccount'
import { mapValues } from 'lodash'
import { memoize } from 'lodash'
import { Natural } from 'money-ts/lib/Natural'
import { show } from 'money-ts/lib/NonZeroInteger'
import { curry } from 'ramda'
import { Observable } from 'rxjs'
import { filter, map, shareReplay, switchMap } from 'rxjs/operators'

// import { createBalances$ } from '../features/balances'
// import { createCollaterals$ } from '../features/collaterals'
import { HasGasEstimation } from '../helpers/form'
import { createTransactionManager } from './account/transactionManager'
import { $Nat, $naturalToString, $parseNaturalUnsafe } from './atoms/numeric'
import { catIlks } from './blockchain/calls/cat'
import { jugIlks } from './blockchain/calls/jug'
import { CallObservable, observe } from './blockchain/calls/observe'
import { spotIlks, spotPar } from './blockchain/calls/spot'
import { networksById } from './blockchain/config'
import { createIlks$, Ilk } from './blockchain/ilks'
import {
  ContextConnected,
  createAccount$,
  createContext$,
  createInitializedAccount$,
  createOnEveryBlock$,
  createWeb3ContextConnected$,
} from './blockchain/network'
import { createVault$, createVaults$ } from './blockchain/vault'

export type TxData = never
// | ApproveData
// | DisapproveData

export interface TxHelpers {
  send: SendTransactionFunction<TxData>
  sendWithGasEstimation: SendTransactionFunction<TxData>
  estimateGas: EstimateGasFunction<TxData>
}

export type AddGasEstimationFunction = <S extends HasGasEstimation>(
  state: S,
  call: (send: TxHelpers, state: S) => Observable<number> | undefined,
) => Observable<S>

export type TxHelpers$ = Observable<TxHelpers>

function createTxHelpers$(
  context$: Observable<ContextConnected>,
  send: SendFunction<TxData>,
  gasPrice$: Observable<BigNumber>,
): TxHelpers$ {
  return context$.pipe(
    filter(({ status }) => status === 'connected'),
    map((context) => ({
      send: createSendTransaction(send, context),
      sendWithGasEstimation: createSendWithGasConstraints(send, context, gasPrice$),
      estimateGas: <B extends TxData>(def: TransactionDef<B>, args: B): Observable<number> => {
        return estimateGas(context, def, args)
      },
    })),
  )
}

export function setupAppContext() {
  const readonlyAccount$ = createReadonlyAccount$()

  const chainIdToRpcUrl = mapValues(networksById, (network) => network.infuraUrl)
  const chainIdToDAIContractDesc = mapValues(networksById, (network) => network.tokens.DAI)
  const [web3Context$, setupWeb3Context$] = createWeb3Context$(
    chainIdToRpcUrl,
    chainIdToDAIContractDesc,
  )

  const account$ = createAccount$(web3Context$)
  const initializedAccount$ = createInitializedAccount$(account$)

  web3Context$.subscribe((web3Context) =>
    console.log(
      'web3Context:',
      web3Context.status,
      (web3Context as any).chainId,
      (web3Context as any).account,
    ),
  )

  const web3ContextConnected$ = createWeb3ContextConnected$(web3Context$)

  const [onEveryBlock$] = createOnEveryBlock$(web3ContextConnected$)

  const context$ = createContext$(web3ContextConnected$, readonlyAccount$)

  const connectedContext$ = context$.pipe(
    filter(({ status }) => status === 'connected'),
    shareReplay(1),
  ) as Observable<ContextConnected>

  const [send, transactions$] = createSend<TxData>(
    initializedAccount$,
    onEveryBlock$,
    connectedContext$,
  )

  const gasPrice$ = createGasPrice$(onEveryBlock$, context$).pipe(
    map((x) => BigNumber.max(x.plus(1), x.multipliedBy(1.01).decimalPlaces(0, 0))),
  )

  const txHelpers$: TxHelpers$ = createTxHelpers$(connectedContext$, send, gasPrice$)
  const transactionManager$ = createTransactionManager(transactions$)

  const proxyAddress$ = curry(createProxyAddress$)(connectedContext$)
  const proxyOwner$ = curry(createProxyOwner$)(connectedContext$)

  const cdpManagerUrns$ = observe(
    onEveryBlock$,
    connectedContext$,
    cdpManagerUrns,
    $naturalToString,
  )

  const cdpManagerIlks$ = observe(
    onEveryBlock$,
    connectedContext$,
    cdpManagerIlks,
    $naturalToString,
  )
  const cdpManagerOwner$ = observe(
    onEveryBlock$,
    connectedContext$,
    cdpManagerOwner,
    $naturalToString,
  )

  const vatUrns$ = observe(onEveryBlock$, connectedContext$, vatUrns, ilkUrnAddressTostring)
  const vatGem$ = observe(onEveryBlock$, connectedContext$, vatGem, ilkUrnAddressTostring)
  const spotPar$ = observe(onEveryBlock$, connectedContext$, spotPar)

  const vatIlks$ = observe(onEveryBlock$, connectedContext$, vatIlks)
  const spotIlks$ = observe(onEveryBlock$, connectedContext$, spotIlks)
  const jugIlks$ = observe(onEveryBlock$, connectedContext$, jugIlks)
  const catIlks$ = observe(onEveryBlock$, connectedContext$, catIlks)

  // const balance$ = observe(onEveryBlock$, connectedContext$, tokenBalance)
  // const collaterals$ = createCollaterals$(context$)

  // const vatUrnsx$ = connectedContext$.pipe(
  //   switchMap((context) => call(context, vatUrns)({ ilk: 'ETH-A', urnAddress: 'ss' })),
  // )

  // const x = vatUrnsx$.subscribe((urn) => {
  //   const y = urn.collateral
  // })

  // // computed
  // const tokenOraclePrice$ = memoize(curry(createTokenOraclePrice$)(vatIlks$, spotPar$, spotIlks$))
  //const ilk$ = curry(createIlks$)(vatIlks$, spotIlks$, jugIlks$, catIlks$)
  // const controller$ = memoize(
  //   curry(createController$)(proxyOwner$, cdpManagerOwner$),
  //   bigNumerTostring,
  // )
  // const balances$ = memoize(curry(createBalances$)(collaterals$, balance$))

  //ilk$('ETH-A').subscribe(({ stabilityFee }) => console.log(stabilityFee.toPercentage()))

  jugIlks$('AAVE-A').subscribe((x) => console.log(x))

  const vault$ = memoize(
    curry(createVault$)(
      cdpManagerUrns$,
      cdpManagerIlks$,
      cdpManagerOwner$,
      vatUrns$,
      //vatGem$,
      //ilk$,
      // tokenOraclePrice$,
      // controller$,
    ),
    $naturalToString,
  )

  const vaults$ = curry(createVaults$)(connectedContext$, proxyAddress$, vault$)

  // const vaultSummary$ = curry(createVaultSummary)(vaults$)

  vault$($Nat('500')).subscribe((v) => console.log(v))

  return {
    web3Context$,
    setupWeb3Context$,
    initializedAccount$,
    context$,
    onEveryBlock$,
    txHelpers$,
    readonlyAccount$,
    transactionManager$,
    proxyAddress$,
    proxyOwner$,
    vaults$,
    vault$,
    cdpManagerUrns$,
    cdpManagerIlks$,
    cdpManagerOwner$,

    // vaultSummary$,
    // balances$,
  }
}

function ilkUrnAddressTostring({ ilk, urnAddress }: { ilk: Ilk; urnAddress: string }): string {
  return `${ilk}-${urnAddress}`
}

export type AppContext = ReturnType<typeof setupAppContext>
