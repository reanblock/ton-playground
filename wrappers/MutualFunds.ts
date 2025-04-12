import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type MutualFundsConfig = {
    addr1: Address,
    addr2: Address,
    fundBalance: bigint
};

export function mutualFundsConfigToCell(config: MutualFundsConfig): Cell {
    return beginCell()
            .storeAddress(config.addr1)
            .storeAddress(config.addr1)
            .storeCoins(config.fundBalance)
            .endCell();
}

export class MutualFunds implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new MutualFunds(address);
    }

    static createFromConfig(config: MutualFundsConfig, code: Cell, workchain = 0) {
        const data = mutualFundsConfigToCell(config);
        const init = { code, data };
        return new MutualFunds(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendAuthorizeFundTransfer(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value, // the amount of TON coins
            sendMode: SendMode.PAY_GAS_SEPARATELY, // specifies that gas costs will be covered separately from the message value
            body: beginCell()
                    .storeBit(1)
                    .endCell()
        })
    }

    async getFundBalance(provider: ContractProvider) {
        const result = await provider.get('get_fund_balance', []);
        return result.stack.readBigNumber();
    }
}
