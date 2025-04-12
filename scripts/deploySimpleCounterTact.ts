import { toNano } from '@ton/core';
import { SimpleCounterTact } from '../wrappers/SimpleCounterTact';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const simpleCounterTact = provider.open(await SimpleCounterTact.fromInit(BigInt(Math.floor(Math.random() * 10000))));

    await simpleCounterTact.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(simpleCounterTact.address);

    console.log('ID', await simpleCounterTact.getId());
}
