import { toNano } from '@ton/core';
import { RawReserve } from '../wrappers/RawReserve';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const rawReserve = provider.open(RawReserve.createFromConfig({}, await compile('RawReserve')));

    await rawReserve.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(rawReserve.address);

    // run methods on `rawReserve`
}
