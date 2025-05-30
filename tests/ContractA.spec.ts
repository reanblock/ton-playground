import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { ContractA } from '../wrappers/ContractA';
import { ContractB } from '../wrappers/ContractB';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('ContractA', () => {
    let contractAcode: Cell;
    let contractBcode: Cell;

    beforeAll(async () => {
        contractAcode = await compile('ContractA');
        contractBcode = await compile('ContractB');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let contractA: SandboxContract<ContractA>;
    let contractB: SandboxContract<ContractB>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');

        // deploy contractB first
        contractB = blockchain.openContract(ContractB.createFromConfig({callCounter: 0}, contractBcode));
        const deployContractBResult = await contractB.sendDeploy(deployer.getSender(), toNano('0.05'));

        // deploy contractA with 100 TON balance and reference contractB
        contractA = blockchain.openContract(ContractA.createFromConfig({contractB: contractB.address}, contractAcode));
        const deployContractAResult = await contractA.sendDeploy(deployer.getSender(), toNano('100'));

        expect(deployContractAResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: contractA.address,
            deploy: true,
            success: true,
        });
    });

    it('should send a message from A -> B', async () => {
        const callCounterBefore = await contractB.getCallCounter();
        const opcode = 0; // happy path - no bounce

        // send message to transafer 10 TON to contract B
        const sendMessageAtoBResult = await contractA.sendMessageAtoB(deployer.getSender(), toNano(0.01), opcode, toNano(10));

        // confirm message was sent from contractA to contractB
        expect(sendMessageAtoBResult.transactions).toHaveTransaction({
            from: contractA.address,
            to: contractB.address,
            deploy: false,
            success: true,
        });

        const callCounterAfter = await contractB.getCallCounter();

        // expect the `call_counter` in contract b to have incremented
        expect(callCounterAfter).toBe(callCounterBefore + 1);
    });

    it('should send a message from A -> B -> bounced -> A', async () => {
        const callCounterBefore = await contractB.getCallCounter();
        const opcode = 1; // will throw in B and bounce back to A

        // send message to transafer 10 TON to contract B
        const sendMessageAtoBResult = await contractA.sendMessageAtoB(deployer.getSender(), toNano(0.01), opcode, toNano(10));

        // confirm message was sent from contractA to contractB
        expect(sendMessageAtoBResult.transactions).toHaveTransaction({
            from: contractA.address,
            to: contractB.address,
            deploy: false,
            success: false, // bounced
        });

        const callCounterAfter = await contractB.getCallCounter();

        // expect the `call_counter` in contract b to remain the same
        expect(callCounterAfter).toBe(callCounterBefore);
    });
});
