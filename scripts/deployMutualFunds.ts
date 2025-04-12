import { toNano } from '@ton/core';
import { MutualFunds } from '../wrappers/MutualFunds';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const mutualFunds = provider.open(MutualFunds.createFromConfig({}, await compile('MutualFunds')));

    await mutualFunds.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(mutualFunds.address);

    // run methods on `mutualFunds`
}
