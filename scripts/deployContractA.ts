import { toNano } from '@ton/core';
import { ContractA } from '../wrappers/ContractA';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const contractA = provider.open(ContractA.createFromConfig({}, await compile('ContractA')));

    await contractA.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(contractA.address);

    // run methods on `contractA`
}
