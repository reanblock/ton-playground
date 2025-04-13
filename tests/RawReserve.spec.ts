import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { RawReserve } from '../wrappers/RawReserve';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('RawReserve', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('RawReserve');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let rawReserve: SandboxContract<RawReserve>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        rawReserve = blockchain.openContract(RawReserve.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        // Deploying contract with an initial balance of 100 TON
        const deployResult = await rawReserve.sendDeploy(deployer.getSender(), toNano('100'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: rawReserve.address,
            deploy: true,
            success: true,
        });
    });

    it("when requesting mode 128 transfer after calling raw_reserve all unreserved balance is sent to caller", async () => {
        const deployerTonBalanceBefore = await deployer.getBalance();
        // sending message with opcode zero which will reserve 70 TON before the transfer
        await rawReserve.sendWithdrawRequest(deployer.getSender(), toNano(0.01), 0n);

        const deployerTonBalanceAfterFirst = await deployer.getBalance();
        const deployerBalanceChangeFirst = deployerTonBalanceAfterFirst - deployerTonBalanceBefore; 

        // should be almsot 30 TON since 70 TON was reserved in the contrat (NOTE: the contract has an intiial balance of 100 TON)
        expect(deployerBalanceChangeFirst).toBe(toNano(29.996356400));
        
        // sending another message with opcode one which does NOT reserver any before the transfer
        await rawReserve.sendWithdrawRequest(deployer.getSender(), toNano(0.01), 1n);
        
        const deployerTonBalanceAfterSecond = await deployer.getBalance();
        
        const deployerBalanceChangeSecond = deployerTonBalanceAfterSecond - deployerTonBalanceAfterFirst; 
        
        // should be the remaining contract baalance (approx: 70 TON)
        expect(deployerBalanceChangeSecond).toBe(toNano(69.996718400));
    });
});
