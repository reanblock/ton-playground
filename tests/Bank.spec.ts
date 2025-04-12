import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Bank } from '../wrappers/Bank';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Bank', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Bank');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let bank: SandboxContract<Bank>;
    const fee = toNano(0.01);

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        
        deployer = await blockchain.treasury('deployer');

        bank = blockchain.openContract(Bank.createFromConfig({address: deployer.address}, code));

        const deployResult = await bank.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: bank.address,
            deploy: true,
            success: true,
        });
    });

    it("should deposit toncoin into senders bank account", async () => {
        const sendResult = await bank.sendDeposit(deployer.getSender(), toNano(100));
       
        const senderAccountBalanceAfter = await bank.getUserBalance(deployer.address);
        expect(senderAccountBalanceAfter).toBe(toNano(100) - fee);

        expect(sendResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: bank.address,
            success: true
        });
    });

    it("should allow multiple deposit toncoin into senders bank account", async () => {
        await bank.sendDeposit(deployer.getSender(), toNano(100));
       
        const senderAccountBalance1 = await bank.getUserBalance(deployer.address);
        expect(senderAccountBalance1).toBe(toNano(100) - fee);

        const sendResult= await bank.sendDeposit(deployer.getSender(), toNano(50));
       
        const senderAccountBalance2 = await bank.getUserBalance(deployer.address);
        expect(senderAccountBalance2).toBe(senderAccountBalance1 + (toNano(50) - fee));

        expect(sendResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: bank.address,
            success: true
        });
    });

    it("should deposit and then widthraw toncoin from depositors bank account", async () => {
        await bank.sendDeposit(deployer.getSender(), toNano(100));
        const depositAmount = toNano(100) - fee;
        const withdrawAmount = toNano(70); // no fee to withdraw
        
        const sendResult = await bank.sendWithdraw(deployer.getSender(), toNano(0.01), toNano(70));
        
        const senderAccountBalanceAfter = await bank.getUserBalance(deployer.address);
        expect(senderAccountBalanceAfter).toBe(depositAmount - withdrawAmount);

        expect(sendResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: bank.address,
            success: true
        });
    });
});
