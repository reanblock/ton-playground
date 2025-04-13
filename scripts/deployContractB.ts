import { toNano } from '@ton/core';
import { ContractB } from '../wrappers/ContractB';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const contractB = provider.open(ContractB.createFromConfig({}, await compile('ContractB')));

    await contractB.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(contractB.address);

    // run methods on `contractB`
}
