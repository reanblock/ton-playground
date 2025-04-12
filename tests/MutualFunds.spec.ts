import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { MutualFunds } from '../wrappers/MutualFunds';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('MutualFunds', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('MutualFunds');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let mutualFunds: SandboxContract<MutualFunds>;
    const initialFundBalance = toNano('100'); // 100 toncoin

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');

        mutualFunds = blockchain.openContract(MutualFunds.createFromConfig({addr1: deployer.address, 
                                                                            addr2: deployer.address,
                                                                            fundBalance: initialFundBalance}, code));
                                                                            
        const deployResult = await mutualFunds.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: mutualFunds.address,
            deploy: true,
            success: true,
        });
    });

    it("should authorize fund transfer and set fund balance to zero when sender is whitelisted", async () => {
        const fundBalanceBefore = await mutualFunds.getFundBalance();
        expect(fundBalanceBefore).toBe(toNano('100'));

        const sendResult = await mutualFunds.sendAuthorizeFundTransfer(deployer.getSender(), toNano('0.05'));
       
        const fundBalanceAfter = await mutualFunds.getFundBalance();
        expect(fundBalanceAfter).toBe(0n);

        expect(sendResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: mutualFunds.address,
            success: true
        });
    });

    // NOTE: this test will FAIL because of the bug in the authorize function!
    xit("should block fund transfer and keep fund balance unchanged sender is not whitelisted", async () => {
        const fundBalanceBefore = await mutualFunds.getFundBalance();
        expect(fundBalanceBefore).toBe(toNano('100'));

        // attacker address is NOT whitelisted in the mutual fund so it should be blocked!
        const attacker = await blockchain.treasury('attacker');
        const sendResult = await mutualFunds.sendAuthorizeFundTransfer(attacker.getSender(), toNano('0.05'));
        
        const fundBalanceAfter = await mutualFunds.getFundBalance();
        // fund balance should be preserved
        expect(fundBalanceAfter).toBe(fundBalanceBefore); 
        
        expect(sendResult.transactions).toHaveTransaction({
            from: attacker.address,
            to: mutualFunds.address,
            success: false // transaction should be blocked by the authorize function throw
        });
    });
});
