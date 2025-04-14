import { toNano } from '@ton/core';
import { AcceptMessage } from '../wrappers/AcceptMessage';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const acceptMessage = provider.open(AcceptMessage.createFromConfig({}, await compile('AcceptMessage')));

    await acceptMessage.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(acceptMessage.address);

    // run methods on `acceptMessage`
}
