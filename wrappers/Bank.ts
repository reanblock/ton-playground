import { Address, Dictionary, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, Builder } from '@ton/core';

export type BankConfig = {
    address: Address
};

export function bankConfigToCell(config: BankConfig): Cell {
    // Create a dictionary with direct coin serialization (no nested cells)
    const accounts = Dictionary.empty(
        Dictionary.Keys.BigUint(256),
        // Define custom serialization that directly stores coins in the value slice
        {
            serialize: (src: bigint, builder) => {
                builder.storeCoins(src);
            },
            parse: (slice) => {
                return slice.loadCoins();
            }
        }
    );
    
    // Convert address to hash and store initial balance
    const addressHash = BigInt('0x' + config.address.hash.toString('hex'));
    accounts.set(addressHash, 0n); // Set initial balance to 0
    
    // Store the dictionary in a cell
    return beginCell()
        .storeDict(accounts)
        .endCell();
}

export class Bank implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Bank(address);
    }

    static createFromConfig(config: BankConfig, code: Cell, workchain = 0) {
        const data = bankConfigToCell(config);
        const init = { code, data };
        return new Bank(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendDeposit(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value, // the amount of TON coins
            sendMode: SendMode.PAY_GAS_SEPARATELY, // specifies that gas costs will be covered separately from the message value
            body: beginCell()
                    .storeInt(0, 32) // opcode zero for deposit action
                    .storeInt(999999, 64) // queryid can be anything 
                    .endCell()
        })
    }

    async sendWithdraw(provider: ContractProvider, via: Sender, value: bigint, amount: bigint) {
        await provider.internal(via, {
            value, // the amount of TON coins
            sendMode: SendMode.PAY_GAS_SEPARATELY, // specifies that gas costs will be covered separately from the message value
            body: beginCell()
                    .storeInt(1, 32) // opcode one for withdraw action
                    .storeInt(999999, 64) // queryid can be anything 
                    .storeCoins(amount) // amount requested to withdraw
                    .endCell()
        })
    }
    
    async getUserBalance(provider: ContractProvider, address: Address) {
        const addressHash = BigInt('0x' + address.hash.toString('hex'));
        const result = await provider.get('get_user_balance', [{ type: "int", value: addressHash }]);
        return result.stack.readBigNumber();
    }
}
