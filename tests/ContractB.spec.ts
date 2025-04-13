import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { ContractB } from '../wrappers/ContractB';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('ContractB', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('ContractB');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let contractB: SandboxContract<ContractB>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        contractB = blockchain.openContract(ContractB.createFromConfig({callCounter: 0}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await contractB.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: contractB.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and contractB are ready to use
    });
});
