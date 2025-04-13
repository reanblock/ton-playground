import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type RawReserveConfig = {};

export function rawReserveConfigToCell(config: RawReserveConfig): Cell {
    return beginCell().endCell();
}

export class RawReserve implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new RawReserve(address);
    }

    static createFromConfig(config: RawReserveConfig, code: Cell, workchain = 0) {
        const data = rawReserveConfigToCell(config);
        const init = { code, data };
        return new RawReserve(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendWithdrawRequest(provider: ContractProvider, via: Sender, value: bigint, opcode: bigint) {
        await provider.internal(via, {
            value, // the amount of TON coins
            sendMode: SendMode.PAY_GAS_SEPARATELY, // specifies that gas costs will be covered separately from the message value
            body: beginCell()
                    .storeInt(opcode, 32) // opcode
                    .storeInt(999999, 64) // queryid can be anything 
                    .endCell()
        })
    }
}
