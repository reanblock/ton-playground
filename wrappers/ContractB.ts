import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type ContractBConfig = {counter: number;};

export function contractBConfigToCell(config: ContractBConfig): Cell {
    return beginCell().storeUint(config.counter, 32).endCell();
}

export class ContractB implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new ContractB(address);
    }

    static createFromConfig(config: ContractBConfig, code: Cell, workchain = 0) {
        const data = contractBConfigToCell(config);
        const init = { code, data };
        return new ContractB(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
}
