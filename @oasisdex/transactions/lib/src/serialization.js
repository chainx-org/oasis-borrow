"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeTransactions = exports.deserializeTransactions = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const types_1 = require("./types");
// By default - toJSON method returns a string and we override it with our implementation that
// returns other type so we need to ignore the error
// eslint-disable-next-line
// @ts-ignore
bignumber_js_1.default.prototype.toJSON = function toJSON() {
    return {
        _type: 'BigNumber',
        _data: Object.assign({}, this),
    };
};
function reviveFromJSON(_key, value) {
    if (typeof value === 'object' && value !== null && value.hasOwnProperty('_type')) {
        switch (value._type) {
            case 'BigNumber':
                return Object.assign(new bignumber_js_1.default(0), value._data);
        }
    }
    const reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
    if (reISO.exec(value))
        return new Date(value);
    return value;
}
function deserializeTransactions(serializedTransactions) {
    return JSON.parse(serializedTransactions, reviveFromJSON);
}
exports.deserializeTransactions = deserializeTransactions;
function serializeTransactions(transactions) {
    return JSON.stringify(transactions.filter((tx) => tx.status !== types_1.TxStatus.CancelledByTheUser && tx.status !== types_1.TxStatus.WaitingForApproval));
}
exports.serializeTransactions = serializeTransactions;
//# sourceMappingURL=serialization.js.map
