import { toNano } from '@ton/core';
import { MistiExitCodeCheck } from '../wrappers/MistiExitCodeCheck';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const mistiExitCodeCheck = provider.open(await MistiExitCodeCheck.fromInit());

    await mistiExitCodeCheck.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(mistiExitCodeCheck.address);

    // run methods on `mistiExitCodeCheck`
}
