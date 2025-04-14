import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type ContractAConfig = {
    contractB: Address
};

export function contractAConfigToCell(config: ContractAConfig): Cell {
    return beginCell()
                .storeAddress(config.contractB)
           .endCell();
}

export class ContractA implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new ContractA(address);
    }

    static createFromConfig(config: ContractAConfig, code: Cell, workchain = 0) {
        const data = contractAConfigToCell(config);
        const init = { code, data };
        return new ContractA(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendMessageAtoB(provider: ContractProvider, via: Sender, value: bigint, opcode: number, amount: bigint) {
        await provider.internal(via, {
            value, // the amount of TON coins
            sendMode: SendMode.PAY_GAS_SEPARATELY, // specifies that gas costs will be covered separately from the message value
            body: beginCell()
                    .storeInt(opcode, 32) // opcode 
                    .storeInt(999999, 64) // queryid can be anything 
                    .storeCoins(amount) // amount requested to send from A -> B
                    .endCell()
        })
    }
}
