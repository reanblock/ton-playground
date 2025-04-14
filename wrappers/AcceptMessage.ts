import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type AcceptMessageConfig = {};

export function acceptMessageConfigToCell(config: AcceptMessageConfig): Cell {
    return beginCell()
            .storeInt(0, 32)
            .storeInt(0, 32)
            .storeInt(0, 32)
        .endCell();
}

export class AcceptMessage implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new AcceptMessage(address);
    }

    static createFromConfig(config: AcceptMessageConfig, code: Cell, workchain = 0) {
        const data = acceptMessageConfigToCell(config);
        const init = { code, data };
        return new AcceptMessage(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }
    
    async sendMessage(provider: ContractProvider, via: Sender, value: bigint, opcode: number) {
        await provider.internal(via, {
            value, // the amount of TON coins
            sendMode: SendMode.PAY_GAS_SEPARATELY, // specifies that gas costs will be covered separately from the message value
            body: beginCell()
                    .storeInt(opcode, 32) // opcode 
                    .storeInt(999999, 64) // queryid can be anything 
                    .endCell()
        })
    }

    async getValues(provider: ContractProvider) {
        const result = await provider.get('get_values', []);
        // console.log(result.stack.readBigNumber());
        return {
            a: result.stack.readBigNumber(),
            b: result.stack.readBigNumber(),
            c: result.stack.readBigNumber()
        };
    }
}
