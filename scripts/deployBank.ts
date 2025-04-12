import { toNano } from '@ton/core';
import { Bank } from '../wrappers/Bank';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const bank = provider.open(Bank.createFromConfig({}, await compile('Bank')));

    await bank.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(bank.address);

    // run methods on `bank`
}
