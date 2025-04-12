import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { SimpleCounterTact } from '../wrappers/SimpleCounterTact';
import '@ton/test-utils';

describe('SimpleCounterTact', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let simpleCounterTact: SandboxContract<SimpleCounterTact>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        simpleCounterTact = blockchain.openContract(await SimpleCounterTact.fromInit(0n));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await simpleCounterTact.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: simpleCounterTact.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and simpleCounterTact are ready to use
    });

    it('should increase counter', async () => {
        const increaseTimes = 3;
        for (let i = 0; i < increaseTimes; i++) {
            // console.log(`increase ${i + 1}/${increaseTimes}`);

            const increaser = await blockchain.treasury('increaser' + i);

            const counterBefore = await simpleCounterTact.getCounter();

            // console.log('counter before increasing', counterBefore);

            const increaseBy = BigInt(Math.floor(Math.random() * 100));

            // console.log('increasing by', increaseBy);

            const increaseResult = await simpleCounterTact.send(
                increaser.getSender(),
                {
                    value: toNano('0.05'),
                },
                {
                    $$type: 'Add',
                    queryId: 0n,
                    amount: increaseBy,
                }
            );

            expect(increaseResult.transactions).toHaveTransaction({
                from: increaser.address,
                to: simpleCounterTact.address,
                success: true,
            });

            const counterAfter = await simpleCounterTact.getCounter();

            // console.log('counter after increasing', counterAfter);

            expect(counterAfter).toBe(counterBefore + increaseBy);
        }
    });
});
