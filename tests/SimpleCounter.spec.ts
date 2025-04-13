import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { SimpleCounter } from '../wrappers/SimpleCounter';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('SimpleCounter', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('SimpleCounter');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let simpleCounter: SandboxContract<SimpleCounter>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        simpleCounter = blockchain.openContract(
            SimpleCounter.createFromConfig(
                {
                    id: 0,
                    counter: 0,
                },
                code
            )
        );

        deployer = await blockchain.treasury('deployer');

        const deployResult = await simpleCounter.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: simpleCounter.address,
            deploy: true,
            success: true,
        });
    });

    it('should increase counter', async () => {
        const increaseTimes = 3;
        for (let i = 0; i < increaseTimes; i++) {
            const increaser = await blockchain.treasury('increaser' + i);

            const counterBefore = await simpleCounter.getCounter();

            const increaseBy = Math.floor(Math.random() * 100);

            const increaseResult = await simpleCounter.sendIncrease(increaser.getSender(), {
                increaseBy,
                value: toNano('0.05'),
            });

            expect(increaseResult.transactions).toHaveTransaction({
                from: increaser.address,
                to: simpleCounter.address,
                success: true,
            });

            const counterAfter = await simpleCounter.getCounter();

            expect(counterAfter).toBe(counterBefore + increaseBy);
        }
    });
});
