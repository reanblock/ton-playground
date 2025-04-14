import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { AcceptMessage } from '../wrappers/AcceptMessage';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('AcceptMessage', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('AcceptMessage');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let acceptMessage: SandboxContract<AcceptMessage>;
    let insufficientGas: bigint;
    let enoughGas: bigint;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        acceptMessage = blockchain.openContract(AcceptMessage.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        enoughGas = toNano('0.01');
        insufficientGas = toNano('0.001');

        const deployResult = await acceptMessage.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: acceptMessage.address,
            deploy: true,
            success: true,
        });
    });

    it("should update all values in the contract sucessfully when sending enough gas", async () => {
        // opcode zero will set a b and c to one (sending with 0.01 TON as gas)
        await acceptMessage.sendMessage(deployer.getSender(), enoughGas, 0); 

        const values = await acceptMessage.getValues();

        // in this case all the values should have been updated to 1
        expect(values.a).toEqual(1n);
        expect(values.b).toEqual(1n);
        expect(values.c).toEqual(1n);
    });

    it("should NOT update ANY values in the contract when sending with ZERO gas to opcode zero", async () => {
        await acceptMessage.sendMessage(deployer.getSender(), toNano('0'), 0); 

        const values = await acceptMessage.getValues();

        // in this case all the values should have been updated to 1
        expect(values.a).toEqual(0n);
        expect(values.b).toEqual(0n);
        expect(values.c).toEqual(0n);
    });

    it("should revert all values due to the throw even with accept_message call", async () => {
        // opcode one will set a & b to one and c will remain unchanged
        await acceptMessage.sendMessage(deployer.getSender(), enoughGas, 1); 

        const values = await acceptMessage.getValues();

        // in this case none of the values will be updated (due to the revert)
        expect(values.a).toEqual(0n);
        expect(values.b).toEqual(0n);
        expect(values.c).toEqual(0n);
    });

    it("should NOT update any values when insufficient gas is sent", async () => {
        // opcode zero will NOT be able to update the values becuase insufficient gas (only sending 0.001)
        await acceptMessage.sendMessage(deployer.getSender(), insufficientGas, 0); 

        const values = await acceptMessage.getValues();

        // in this case all the values should have been updated to 1
        expect(values.a).toEqual(0n);
        expect(values.b).toEqual(0n);
        expect(values.c).toEqual(0n);
    });

    it("should update values when not providig gas to opcode two (since accept_message is called)", async () => {
        // opcode two WILL set a b and c to one even with insuffienct gas due to the accept_message call!
        await acceptMessage.sendMessage(deployer.getSender(), insufficientGas, 2); 

        const values = await acceptMessage.getValues();

        // in this case all the values should have been updated to 1
        expect(values.a).toEqual(1n);
        expect(values.b).toEqual(1n);
        expect(values.c).toEqual(1n);
    });
});
