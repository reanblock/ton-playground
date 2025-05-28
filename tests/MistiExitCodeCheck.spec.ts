import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { MistiExitCodeCheck } from '../wrappers/MistiExitCodeCheck';
import '@ton/test-utils';

describe('MistiExitCodeCheck', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let mistiExitCodeCheck: SandboxContract<MistiExitCodeCheck>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');

        mistiExitCodeCheck = blockchain.openContract(await MistiExitCodeCheck.fromInit(deployer.address));

        const deployResult = await mistiExitCodeCheck.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            },
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: mistiExitCodeCheck.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and mistiExitCodeCheck are ready to use
    });

    it('should error when not called by the owner', async () => {
        const attacker = await blockchain.treasury('attacker');

        const callerResult = await mistiExitCodeCheck.send(
            attacker.getSender(),
            {
                value: toNano('0.05'),
            },
            "callme"
        );

        expect(callerResult.transactions).toHaveTransaction({
            from: attacker.address,
            to: mistiExitCodeCheck.address,
            success: false, // because caller is not owner
        });
    })
});
