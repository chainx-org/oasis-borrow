"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrezorSubprovider = void 0;
const assert_1 = require("@0x/assert");
const utils_1 = require("@0x/utils");
const ethereumjs_tx_1 = require("ethereumjs-tx");
const hdkey_1 = __importDefault(require("hdkey"));
const _ = __importStar(require("lodash"));
const base_wallet_subprovider_1 = require("@0x/subproviders/lib/src/subproviders/base_wallet_subprovider");
const types_1 = require("@0x/subproviders/lib/src/types");
const wallet_utils_1 = require("@0x/subproviders/lib/src/utils/wallet_utils");
const PRIVATE_KEY_PATH = `44'/60'/0'/0`;
const PRIVATE_KEY_PATH_TESTNET = `44'/1'/0'/0`;
const DEFAULT_NUM_ADDRESSES_TO_FETCH = 10;
const DEFAULT_ADDRESS_SEARCH_LIMIT = 1000;
class TrezorSubprovider extends base_wallet_subprovider_1.BaseWalletSubprovider {
    /**
     * Instantiates a TrezorSubprovider. Defaults to private key path set to `44'/60'/0'/0/`.
     * Must be initialized with trezor-connect API module https://github.com/trezor/connect.
     * @param TrezorSubprovider config object containing trezor-connect API
     * @return TrezorSubprovider instance
     */
    constructor(config) {
        super();
        this._privateKeyPath = config.networkId === 1 ? PRIVATE_KEY_PATH : PRIVATE_KEY_PATH_TESTNET;
        this._trezorConnectClientApi = config.trezorConnectClientApi;
        this._networkId = config.networkId;
        this._addressSearchLimit =
            config.accountFetchingConfigs !== undefined &&
                config.accountFetchingConfigs.addressSearchLimit !== undefined
                ? config.accountFetchingConfigs.addressSearchLimit
                : DEFAULT_ADDRESS_SEARCH_LIMIT;
    }
    /**
     * Retrieve a users Trezor account. This method is automatically called
     * when issuing a `eth_accounts` JSON RPC request via your providerEngine
     * instance.
     * @return An array of accounts
     */
    async getAccountsAsync(numberOfAccounts = DEFAULT_NUM_ADDRESSES_TO_FETCH) {
        const initialDerivedKeyInfo = await this._initialDerivedKeyInfoAsync();
        const derivedKeyInfos = wallet_utils_1.walletUtils.calculateDerivedHDKeyInfos(initialDerivedKeyInfo, numberOfAccounts);
        const accounts = _.map(derivedKeyInfos, (k) => k.address);
        return accounts;
    }
    /**
     * Signs a transaction on the Trezor with the account specificed by the `from` field in txParams.
     * If you've added the TrezorSubprovider to your app's provider, you can simply send an `eth_sendTransaction`
     * JSON RPC request, and this method will be called auto-magically. If you are not using this via a ProviderEngine
     * instance, you can call it directly.
     * @param txPara  ms Parameters of the transaction to sign
     * @return Signed transaction hex string
     */
    async signTransactionAsync(txData) {
        if (txData.from === undefined || !utils_1.addressUtils.isAddress(txData.from)) {
            throw new Error(types_1.WalletSubproviderErrors.FromAddressMissingOrInvalid);
        }
        txData.value = txData.value ? txData.value : '0x0';
        txData.data = txData.data ? txData.data : '0x';
        txData.gas = txData.gas ? txData.gas : '0x0';
        txData.gasPrice = txData.gasPrice ? txData.gasPrice : '0x0';
        const initialDerivedKeyInfo = await this._initialDerivedKeyInfoAsync();
        const derivedKeyInfo = this._findDerivedKeyInfoForAddress(initialDerivedKeyInfo, txData.from);
        const fullDerivationPath = derivedKeyInfo.derivationPath;
        const response = await this._trezorConnectClientApi.ethereumSignTransaction({
            path: fullDerivationPath,
            transaction: {
                to: txData.to,
                value: txData.value,
                data: txData.data,
                chainId: this._networkId,
                nonce: txData.nonce,
                gasLimit: txData.gas,
                gasPrice: txData.gasPrice,
            },
        });
        if (response.success) {
            const payload = response.payload;
            const tx = new ethereumjs_tx_1.Transaction(txData, { chain: this._networkId });
            // Set the EIP155 bits
            const vIndex = 6;
            tx.raw[vIndex] = Buffer.from([1]); // v
            const rIndex = 7;
            tx.raw[rIndex] = Buffer.from([]); // r
            const sIndex = 8;
            tx.raw[sIndex] = Buffer.from([]); // s
            // slice off leading 0x
            tx.v = Buffer.from(payload.v.slice(2), 'hex');
            tx.r = Buffer.from(payload.r.slice(2), 'hex');
            tx.s = Buffer.from(payload.s.slice(2), 'hex');
            return `0x${tx.serialize().toString('hex')}`;
        }
        else {
            const payload = response.payload;
            throw new Error(payload.error);
        }
    }
    /**
     * Sign a personal Ethereum signed message. The signing account will be the account
     * associated with the provided address. If you've added the TrezorSubprovider to
     * your app's provider, you can simply send an `eth_sign` or `personal_sign` JSON RPC
     * request, and this method will be called auto-magically.
     * If you are not using this via a ProviderEngine instance, you can call it directly.
     * @param data Hex string message to sign
     * @param address Address of the account to sign with
     * @return Signature hex string (order: rsv)
     */
    async signPersonalMessageAsync(data, address) {
        if (data === undefined) {
            throw new Error(types_1.WalletSubproviderErrors.DataMissingForSignPersonalMessage);
        }
        assert_1.assert.isHexString('data', data);
        assert_1.assert.isETHAddressHex('address', address);
        const initialDerivedKeyInfo = await this._initialDerivedKeyInfoAsync();
        const derivedKeyInfo = this._findDerivedKeyInfoForAddress(initialDerivedKeyInfo, address);
        const fullDerivationPath = derivedKeyInfo.derivationPath;
        const response = await this._trezorConnectClientApi.ethereumSignMessage({
            path: fullDerivationPath,
            message: data,
            hex: true,
        });
        if (response.success) {
            const payload = response.payload;
            return `0x${payload.signature}`;
        }
        else {
            const payload = response.payload;
            throw new Error(payload.error);
        }
    }
    /**
     * TODO:: eth_signTypedData is currently not supported on Trezor devices.
     * @param address Address of the account to sign with
     * @param data the typed data object
     * @return Signature hex string (order: rsv)
     */
    // tslint:disable-next-line:prefer-function-over-method
    async signTypedDataAsync(_address, _typedData) {
        throw new Error(types_1.WalletSubproviderErrors.MethodNotSupported);
    }
    async _initialDerivedKeyInfoAsync() {
        if (this._initialDerivedKeyInfo) {
            return this._initialDerivedKeyInfo;
        }
        else {
            const parentKeyDerivationPath = `m/${this._privateKeyPath}`;
            const response = await this._trezorConnectClientApi.getPublicKey({
                path: parentKeyDerivationPath,
            });
            if (response.success) {
                const payload = response.payload;
                const hdKey = new hdkey_1.default();
                hdKey.publicKey = new Buffer(payload.publicKey, 'hex');
                hdKey.chainCode = new Buffer(payload.chainCode, 'hex');
                const address = wallet_utils_1.walletUtils.addressOfHDKey(hdKey);
                const initialDerivedKeyInfo = {
                    hdKey,
                    address,
                    derivationPath: parentKeyDerivationPath,
                    baseDerivationPath: this._privateKeyPath,
                };
                this._initialDerivedKeyInfo = initialDerivedKeyInfo;
                return initialDerivedKeyInfo;
            }
            else {
                const payload = response.payload;
                throw new Error(payload.error);
            }
        }
    }
    _findDerivedKeyInfoForAddress(initalHDKey, address) {
        const matchedDerivedKeyInfo = wallet_utils_1.walletUtils.findDerivedKeyInfoForAddressIfExists(address, initalHDKey, this._addressSearchLimit);
        if (matchedDerivedKeyInfo === undefined) {
            throw new Error(`${types_1.WalletSubproviderErrors.AddressNotFound}: ${address}`);
        }
        return matchedDerivedKeyInfo;
    }
}
exports.TrezorSubprovider = TrezorSubprovider;
//# sourceMappingURL=trezorSubprovider.js.map
